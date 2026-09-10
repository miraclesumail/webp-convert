import JSZip from 'jszip';
import { ImageItem } from '../types';

/**
 * Format bytes into human-readable string (B, KB, MB)
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Convert file name to .webp extension
 */
export function getWebpFilename(originalName: string): string {
  const lastDotIndex = originalName.lastIndexOf('.');
  const baseName = lastDotIndex !== -1 ? originalName.slice(0, lastDotIndex) : originalName;
  return `${baseName}.webp`;
}

/**
 * Convert a single PNG file to WebP with specified quality
 */
export async function convertPngToWebp(
  file: File,
  quality: number,
  onProgress?: (percent: number) => void
): Promise<{
  blob: Blob;
  url: string;
  width: number;
  height: number;
  size: number;
}> {
  return new Promise((resolve, reject) => {
    onProgress?.(10);
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      onProgress?.(40);
      try {
        const width = img.naturalWidth;
        const height = img.naturalHeight;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          reject(new Error('无法创建Canvas绘图上下文'));
          return;
        }

        // Keep alpha transparency intact
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0);

        onProgress?.(70);

        // Quality: 1.0 represents highest quality, down to 0.01
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(objectUrl);
            if (!blob) {
              reject(new Error('浏览器转换 WebP 失败'));
              return;
            }

            onProgress?.(100);
            const webpUrl = URL.createObjectURL(blob);
            resolve({
              blob,
              url: webpUrl,
              width,
              height,
              size: blob.size,
            });
          },
          'image/webp',
          quality
        );
      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        reject(err instanceof Error ? err : new Error('转换过程中发生未知错误'));
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('无法解码该图片文件，请确认是否为有效PNG图片'));
    };

    img.src = objectUrl;
  });
}

/**
 * Trigger file download directly in browser
 */
export function downloadFile(url: string, filename: string) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Trigger blob download
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  downloadFile(url, filename);
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

/**
 * Bundle all converted images into a zip file
 */
export async function createZipFromImages(
  items: ImageItem[],
  onZipProgress?: (percent: number) => void
): Promise<Blob> {
  const zip = new JSZip();
  const nameCounts: Record<string, number> = {};

  const completedItems = items.filter((item) => item.status === 'completed' && item.webpBlob);

  if (completedItems.length === 0) {
    throw new Error('没有已完成转换的图片可打包');
  }

  for (const item of completedItems) {
    if (!item.webpBlob) continue;
    let fileName = item.webpName;

    // Handle duplicate file names in zip
    if (nameCounts[fileName] !== undefined) {
      nameCounts[fileName]++;
      const dotIdx = fileName.lastIndexOf('.');
      const base = dotIdx !== -1 ? fileName.slice(0, dotIdx) : fileName;
      const ext = dotIdx !== -1 ? fileName.slice(dotIdx) : '';
      fileName = `${base}_(${nameCounts[fileName]})${ext}`;
    } else {
      nameCounts[fileName] = 0;
    }

    zip.file(fileName, item.webpBlob);
  }

  return zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    },
    (metadata) => {
      onZipProgress?.(Math.round(metadata.percent));
    }
  );
}
