import React from 'react';
import {
  Download,
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  ArrowRight,
  TrendingDown,
} from 'lucide-react';
import { ImageItem } from '../types';
import { formatBytes, downloadFile } from '../utils/imageConverter';

interface ImageItemRowProps {
  item: ImageItem;
  onRemove: (id: string) => void;
  onPreview: (item: ImageItem) => void;
}

export const ImageItemRow: React.FC<ImageItemRowProps> = ({ item, onRemove, onPreview }) => {
  const isCompleted = item.status === 'completed';
  const isConverting = item.status === 'converting';
  const isError = item.status === 'error';
  const isIdle = item.status === 'idle';

  const reductionPercent =
    isCompleted && item.webpSize && item.originalSize > 0
      ? Math.round(((item.originalSize - item.webpSize) / item.originalSize) * 100)
      : null;

  const handleDownload = () => {
    if (item.webpUrl && item.webpName) {
      downloadFile(item.webpUrl, item.webpName);
    }
  };

  return (
    <div id={`image-item-${item.id}`} className="bg-white rounded-xl border border-slate-200/80 p-3 sm:p-4 hover:border-slate-300 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      {/* Left: Thumbnail & Info */}
      <div className="flex items-center gap-3.5 min-w-0">
        {/* Thumbnail with checkerboard background for transparent PNG */}
        <div
          id={`image-thumbnail-${item.id}`}
          onClick={() => onPreview(item)}
          className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-lg border border-slate-200 overflow-hidden shrink-0 cursor-pointer group bg-slate-100"
          style={{
            backgroundImage:
              'repeating-conic-gradient(#e2e8f0 0% 25%, #ffffff 0% 50%) 50% / 12px 12px',
          }}
          title="点击查看对比预览"
        >
          <img
            src={item.webpUrl || item.originalUrl}
            alt={item.name}
            className="w-full h-full object-contain transition-transform group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
            <Eye className="w-4 h-4" />
          </div>
          {isCompleted && (
            <div className="absolute bottom-0 right-0 bg-emerald-500 text-white p-0.5 rounded-tl">
              <CheckCircle2 className="w-3 h-3" />
            </div>
          )}
        </div>

        {/* File Information */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4
              className="text-xs sm:text-sm font-semibold text-slate-800 truncate max-w-[200px] sm:max-w-xs md:max-w-md"
              title={item.name}
            >
              {item.name}
            </h4>
            {item.originalWidth && item.originalHeight && (
              <span className="text-[10px] text-slate-400 shrink-0">
                {item.originalWidth}×{item.originalHeight}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
            <span className="text-slate-500">{formatBytes(item.originalSize)}</span>

            {isCompleted && item.webpSize && (
              <>
                <ArrowRight className="w-3 h-3 text-slate-400" />
                <span className="font-semibold text-blue-600">
                  {formatBytes(item.webpSize)}
                </span>
                {reductionPercent !== null && (
                  <span
                    className={`inline-flex items-center gap-0.5 text-[11px] px-1.5 py-0.2 rounded font-medium ${
                      reductionPercent > 0
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {reductionPercent > 0 && <TrendingDown className="w-3 h-3" />}
                    {reductionPercent > 0 ? `-${reductionPercent}%` : '+0%'}
                  </span>
                )}
              </>
            )}

            {isConverting && (
              <span className="text-blue-600 text-xs flex items-center gap-1 font-medium">
                <Loader2 className="w-3 h-3 animate-spin" />
                转换中...
              </span>
            )}

            {isIdle && (
              <span className="text-slate-400 text-xs flex items-center gap-1">
                <Clock className="w-3 h-3" />
                等待中
              </span>
            )}

            {isError && (
              <span className="text-rose-600 text-xs flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {item.errorMessage || '转换失败'}
              </span>
            )}
          </div>

          {/* Item conversion mini progress bar */}
          {isConverting && (
            <div className="w-36 h-1 bg-slate-100 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-200"
                style={{ width: `${item.progress}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        {/* Preview Button */}
        <button
          id={`preview-btn-${item.id}`}
          type="button"
          onClick={() => onPreview(item)}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
          title="预览对比原图与WebP"
        >
          <Eye className="w-4 h-4" />
        </button>

        {/* Individual Download Button */}
        {isCompleted ? (
          <button
            id={`download-webp-${item.id}`}
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 rounded-lg transition cursor-pointer"
            title="下载此 WebP 文件"
          >
            <Download className="w-3.5 h-3.5" />
            下载 WebP
          </button>
        ) : (
          <button
            id={`download-disabled-${item.id}`}
            type="button"
            disabled
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-400 bg-slate-50 rounded-lg border border-slate-100 cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5" />
            待完成
          </button>
        )}

        {/* Delete Item */}
        <button
          id={`remove-item-${item.id}`}
          type="button"
          onClick={() => onRemove(item.id)}
          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
          title="移除"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
