export type ImageStatus = 'idle' | 'converting' | 'completed' | 'error';

export interface ImageItem {
  id: string;
  file: File;
  name: string;
  originalSize: number;
  originalWidth?: number;
  originalHeight?: number;
  originalUrl: string;
  
  // Converted data
  webpBlob?: Blob;
  webpUrl?: string;
  webpSize?: number;
  webpWidth?: number;
  webpHeight?: number;
  webpName: string;
  
  status: ImageStatus;
  progress: number; // 0 to 100
  errorMessage?: string;
}

export interface QualityConfig {
  quality: number; // 0.1 to 1.0 (e.g., 0.9)
  autoDownloadZip: boolean;
  preserveDimensions: boolean;
}
