import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { DropZone } from './components/DropZone';
import { QualitySettings } from './components/QualitySettings';
import { BatchStatusBar } from './components/BatchStatusBar';
import { ImageList } from './components/ImageList';
import { PreviewModal } from './components/PreviewModal';
import { ImageItem, QualityConfig } from './types';
import {
  convertPngToWebp,
  createZipFromImages,
  downloadBlob,
  getWebpFilename,
} from './utils/imageConverter';
import { Sparkles, CheckCircle2, FileCheck, Layers } from 'lucide-react';

export default function App() {
  const [items, setItems] = useState<ImageItem[]>([]);
  const [config, setConfig] = useState<QualityConfig>({
    quality: 0.9,
    autoDownloadZip: true,
    preserveDimensions: true,
  });

  const [isConverting, setIsConverting] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);
  const [zipBlob, setZipBlob] = useState<Blob | null>(null);
  const [previewItem, setPreviewItem] = useState<ImageItem | null>(null);
  const [autoDownloadNotice, setAutoDownloadNotice] = useState<string | null>(null);

  // Keep ref to latest items and config for async operations
  const itemsRef = useRef<ImageItem[]>(items);
  itemsRef.current = items;
  const configRef = useRef<QualityConfig>(config);
  configRef.current = config;

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      itemsRef.current.forEach((item) => {
        URL.revokeObjectURL(item.originalUrl);
        if (item.webpUrl) URL.revokeObjectURL(item.webpUrl);
      });
    };
  }, []);

  /**
   * Process a queue of items with limited concurrency (max 3 at a time)
   */
  const runConversionQueue = useCallback(async (targetItems: ImageItem[]) => {
    if (targetItems.length === 0) return;

    setIsConverting(true);
    setZipBlob(null);
    setAutoDownloadNotice(null);

    const pendingIds = targetItems
      .filter((i) => i.status === 'idle' || i.status === 'error')
      .map((i) => i.id);

    const currentQuality = configRef.current.quality;

    // Helper to process one item
    const processItem = async (id: string) => {
      const current = itemsRef.current.find((i) => i.id === id);
      if (!current) return;

      // Update item status to converting
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, status: 'converting', progress: 10 } : it))
      );

      try {
        const result = await convertPngToWebp(
          current.file,
          currentQuality,
          (pct) => {
            setItems((prev) =>
              prev.map((it) => (it.id === id ? { ...it, progress: pct } : it))
            );
          }
        );

        setItems((prev) =>
          prev.map((it) =>
            it.id === id
              ? {
                  ...it,
                  status: 'completed',
                  progress: 100,
                  webpBlob: result.blob,
                  webpUrl: result.url,
                  webpSize: result.size,
                  webpWidth: result.width,
                  webpHeight: result.height,
                  errorMessage: undefined,
                }
              : it
          )
        );
      } catch (err) {
        setItems((prev) =>
          prev.map((it) =>
            it.id === id
              ? {
                  ...it,
                  status: 'error',
                  progress: 0,
                  errorMessage: err instanceof Error ? err.message : '转换失败',
                }
              : it
          )
        );
      }
    };

    // Concurrency pool of 3
    const concurrency = 3;
    let index = 0;

    const workers = new Array(concurrency).fill(null).map(async () => {
      while (index < pendingIds.length) {
        const currentIdx = index++;
        const id = pendingIds[currentIdx];
        if (id) {
          await processItem(id);
        }
      }
    });

    await Promise.all(workers);
    setIsConverting(false);

    // After all items are converted, create ZIP
    const latestItems = itemsRef.current;
    const completedItems = latestItems.filter((i) => i.status === 'completed' && i.webpBlob);

    if (completedItems.length > 0) {
      setIsZipping(true);
      setZipProgress(10);
      try {
        const zip = await createZipFromImages(latestItems, (pct) => setZipProgress(pct));
        setZipBlob(zip);
        setIsZipping(false);

        // If autoDownloadZip is enabled, trigger download
        if (configRef.current.autoDownloadZip) {
          const zipName = `webp_images_${new Date().toISOString().slice(0, 10)}.zip`;
          downloadBlob(zip, zipName);
          setAutoDownloadNotice('已自动打包并开始下载 ZIP 压缩包！');
          setTimeout(() => setAutoDownloadNotice(null), 8000);
        }
      } catch (e) {
        console.error('ZIP generation error:', e);
        setIsZipping(false);
      }
    }
  }, []);

  /**
   * Handle files added from DropZone or sample generator
   */
  const handleFilesAdded = useCallback(
    async (files: File[]) => {
      const newItems: ImageItem[] = [];

      for (const file of files) {
        const id = Math.random().toString(36).slice(2, 10);
        const originalUrl = URL.createObjectURL(file);
        const webpName = getWebpFilename(file.name);

        const item: ImageItem = {
          id,
          file,
          name: file.name,
          originalSize: file.size,
          originalUrl,
          webpName,
          status: 'idle',
          progress: 0,
        };

        // Measure image natural dimensions
        const img = new Image();
        img.src = originalUrl;
        await new Promise((resolve) => {
          img.onload = () => {
            item.originalWidth = img.naturalWidth;
            item.originalHeight = img.naturalHeight;
            resolve(true);
          };
          img.onerror = () => resolve(true);
        });

        newItems.push(item);
      }

      setItems((prev) => {
        const updated = [...prev, ...newItems];
        // Automatically start conversion on the new items
        setTimeout(() => runConversionQueue(updated), 50);
        return updated;
      });
    },
    [runConversionQueue]
  );

  /**
   * Clear all items and free memory
   */
  const handleClearAll = () => {
    items.forEach((item) => {
      URL.revokeObjectURL(item.originalUrl);
      if (item.webpUrl) URL.revokeObjectURL(item.webpUrl);
    });
    setItems([]);
    setZipBlob(null);
    setAutoDownloadNotice(null);
  };

  /**
   * Remove single item
   */
  const handleRemoveItem = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (item) {
      URL.revokeObjectURL(item.originalUrl);
      if (item.webpUrl) URL.revokeObjectURL(item.webpUrl);
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
    setZipBlob(null);
  };

  /**
   * Download the generated ZIP package manually
   */
  const handleDownloadZip = async () => {
    if (zipBlob) {
      downloadBlob(zipBlob, `webp_images_${Date.now()}.zip`);
    } else {
      setIsZipping(true);
      try {
        const zip = await createZipFromImages(items, (pct) => setZipProgress(pct));
        setZipBlob(zip);
        downloadBlob(zip, `webp_images_${Date.now()}.zip`);
      } catch (err) {
        alert(err instanceof Error ? err.message : '打包失败');
      } finally {
        setIsZipping(false);
      }
    }
  };

  /**
   * Generate sample PNG images for quick demonstration
   */
  const handleAddSampleImages = () => {
    const sampleCanvas = (
      title: string,
      color1: string,
      color2: string,
      width = 800,
      height = 600
    ): Promise<File> => {
      return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Transparent background with subtle grid & graphics
        ctx.clearRect(0, 0, width, height);

        // Draw modern shape
        const gradient = ctx.createLinearGradient(50, 50, width - 50, height - 50);
        gradient.addColorStop(0, color1);
        gradient.addColorStop(1, color2);
        ctx.fillStyle = gradient;

        // Rounded rect
        ctx.beginPath();
        ctx.roundRect(60, 60, width - 120, height - 120, 36);
        ctx.fill();

        // Inner glowing circle
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, 140, 0, Math.PI * 2);
        ctx.fill();

        // Title text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(title, width / 2, height / 2 - 20);

        ctx.font = '20px sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillText('PNG 格式 · 透明通道保持', width / 2, height / 2 + 30);

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(new File([blob], `${title.toLowerCase().replace(/\s+/g, '_')}.png`, { type: 'image/png' }));
          }
        }, 'image/png');
      });
    };

    Promise.all([
      sampleCanvas('Logo Banner', '#2563eb', '#38bdf8', 900, 600),
      sampleCanvas('UI Card', '#4f46e5', '#ec4899', 800, 600),
      sampleCanvas('Icon Badge', '#059669', '#10b981', 600, 600),
    ]).then((sampleFiles) => {
      handleFilesAdded(sampleFiles);
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-500 selection:text-white">
      {/* Header */}
      <Header />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Intro Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              批量 PNG 转 WebP 转换器
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              高质量、保留透明图层、体积大幅缩小，转换完成后自动打包 ZIP 下载
            </p>
          </div>

          {items.length === 0 && (
            <button
              id="load-samples-btn"
              type="button"
              onClick={handleAddSampleImages}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-blue-700 bg-white border border-blue-200 hover:bg-blue-50 hover:border-blue-300 rounded-xl transition shadow-2xs cursor-pointer self-start sm:self-auto"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              一键添加示例图片体验
            </button>
          )}
        </div>

        {/* Notice for auto downloaded zip */}
        {autoDownloadNotice && (
          <div id="auto-download-notice" className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{autoDownloadNotice}</span>
            </div>
            <button
              id="re-download-zip-notice-btn"
              type="button"
              onClick={handleDownloadZip}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 underline cursor-pointer shrink-0"
            >
              重新下载 ZIP
            </button>
          </div>
        )}

        {/* Quality Settings */}
        <QualitySettings
          config={config}
          onChange={(newConfig) => {
            setConfig(newConfig);
          }}
          disabled={isConverting || isZipping}
        />

        {/* Drag & Drop Upload Zone */}
        <DropZone
          onFilesSelected={handleFilesAdded}
          disabled={isConverting || isZipping}
        />

        {/* Batch Status and Overall Progress Bar */}
        <BatchStatusBar
          items={items}
          isConverting={isConverting}
          isZipping={isZipping}
          zipProgress={zipProgress}
          zipBlob={zipBlob}
          onStartConvert={() => runConversionQueue(items)}
          onDownloadZip={handleDownloadZip}
          onClearAll={handleClearAll}
        />

        {/* Image Items List */}
        {items.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span className="font-medium">文件列表明细</span>
              <span>支持逐张下载或查看画质细节</span>
            </div>
            <ImageList
              items={items}
              onRemove={handleRemoveItem}
              onPreview={(item) => setPreviewItem(item)}
            />
          </div>
        ) : (
          <div className="text-center py-10 text-slate-400">
            <Layers className="w-10 h-10 mx-auto stroke-[1.2] text-slate-300 mb-2" />
            <p className="text-sm font-medium text-slate-500">暂无图片待转换</p>
            <p className="text-xs text-slate-400 mt-0.5">
              将电脑中的 PNG 文件拖放到上方区域，或点击上传
            </p>
          </div>
        )}
      </main>

      {/* Comparison Preview Modal */}
      <PreviewModal
        item={previewItem}
        onClose={() => setPreviewItem(null)}
      />

      {/* Minimal Footer */}
      <footer className="border-t border-slate-200/80 py-6 text-center text-xs text-slate-400">
        <p>纯本地 Canvas 高清渲染与 WebP 编码 · 无服务器存储 · 安全高效</p>
      </footer>
    </div>
  );
}
