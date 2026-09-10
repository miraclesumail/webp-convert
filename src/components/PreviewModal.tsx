import React, { useState, useEffect } from 'react';
import { X, Download, ArrowRight, ZoomIn, ZoomOut, Check, Sparkles } from 'lucide-react';
import { ImageItem } from '../types';
import { formatBytes, downloadFile } from '../utils/imageConverter';

interface PreviewModalProps {
  item: ImageItem | null;
  onClose: () => void;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({ item, onClose }) => {
  const [activeTab, setActiveTab] = useState<'split' | 'webp' | 'original'>('split');
  const [sliderPosition, setSliderPosition] = useState(50); // For split comparison slider

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!item) return null;

  const hasWebp = item.status === 'completed' && Boolean(item.webpUrl);

  const handleDownload = () => {
    if (item.webpUrl && item.webpName) {
      downloadFile(item.webpUrl, item.webpName);
    }
  };

  return (
    <div id="image-preview-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-slate-900 truncate" title={item.name}>
              {item.name}
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              <span>原图: {formatBytes(item.originalSize)}</span>
              {hasWebp && item.webpSize && (
                <>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                  <span className="text-blue-600 font-semibold">
                    WebP: {formatBytes(item.webpSize)}
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-medium">
                    减少{' '}
                    {Math.round(
                      ((item.originalSize - item.webpSize) / item.originalSize) * 100
                    )}
                    %
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasWebp && (
              <button
                id="preview-download-webp-btn"
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                下载 WebP
              </button>
            )}
            <button
              id="preview-close-btn"
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View Mode Tabs */}
        {hasWebp && (
          <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-xl">
              <button
                id="preview-tab-split"
                type="button"
                onClick={() => setActiveTab('split')}
                className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                  activeTab === 'split'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                左右滑动对比
              </button>
              <button
                id="preview-tab-webp"
                type="button"
                onClick={() => setActiveTab('webp')}
                className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                  activeTab === 'webp'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                WebP 结果
              </button>
              <button
                id="preview-tab-original"
                type="button"
                onClick={() => setActiveTab('original')}
                className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                  activeTab === 'original'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                PNG 原图
              </button>
            </div>

            {activeTab === 'split' && (
              <span className="text-[11px] text-slate-500 hidden sm:inline">
                拖动中间滑块对比画质细节
              </span>
            )}
          </div>
        )}

        {/* Image Preview Canvas Area */}
        <div
          className="flex-1 overflow-auto p-4 sm:p-6 flex items-center justify-center min-h-[320px] max-h-[65vh] select-none"
          style={{
            backgroundImage:
              'repeating-conic-gradient(#f1f5f9 0% 25%, #ffffff 0% 50%) 50% / 16px 16px',
          }}
        >
          {activeTab === 'split' && hasWebp ? (
            <div className="relative max-w-full max-h-full rounded-xl overflow-hidden shadow-lg border border-slate-200/80">
              {/* Converted WebP (Background) */}
              <img
                src={item.webpUrl}
                alt="WebP"
                className="max-h-[55vh] w-auto object-contain block pointer-events-none"
              />

              {/* Original PNG (Clipped on top) */}
              <div
                className="absolute inset-0 overflow-hidden pointer-events-none"
                style={{ width: `${sliderPosition}%` }}
              >
                <img
                  src={item.originalUrl}
                  alt="Original"
                  className="max-h-[55vh] max-w-none w-auto object-contain block"
                  style={{
                    width: 'auto',
                    height: '100%',
                  }}
                />
              </div>

              {/* Dividing slider bar */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-blue-600 shadow-md cursor-ew-resize pointer-events-none"
                style={{ left: `${sliderPosition}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md text-[10px] font-bold">
                  ↔
                </div>
              </div>

              {/* Interactive Range Input Overlay */}
              <input
                id="preview-split-slider"
                type="range"
                min="0"
                max="100"
                value={sliderPosition}
                onChange={(e) => setSliderPosition(Number(e.target.value))}
                className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full z-10"
              />

              {/* Badge tags */}
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-xs text-white text-[11px] px-2 py-0.5 rounded pointer-events-none">
                PNG 原图
              </div>
              <div className="absolute top-3 right-3 bg-blue-600/80 backdrop-blur-xs text-white text-[11px] px-2 py-0.5 rounded pointer-events-none">
                WebP 结果
              </div>
            </div>
          ) : activeTab === 'webp' && hasWebp ? (
            <div className="relative max-w-full max-h-full rounded-xl overflow-hidden shadow-md border border-slate-200">
              <img
                src={item.webpUrl}
                alt="WebP"
                className="max-h-[55vh] w-auto object-contain block"
              />
              <div className="absolute top-3 left-3 bg-blue-600/80 text-white text-[11px] px-2 py-0.5 rounded">
                WebP 格式
              </div>
            </div>
          ) : (
            <div className="relative max-w-full max-h-full rounded-xl overflow-hidden shadow-md border border-slate-200">
              <img
                src={item.originalUrl}
                alt="Original"
                className="max-h-[55vh] w-auto object-contain block"
              />
              <div className="absolute top-3 left-3 bg-black/60 text-white text-[11px] px-2 py-0.5 rounded">
                PNG 原图
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div>
            分辨率:{' '}
            <span className="font-semibold text-slate-700">
              {item.originalWidth || '--'} × {item.originalHeight || '--'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
            <Check className="w-3.5 h-3.5" />
            透明通道保留完好
          </div>
        </div>
      </div>
    </div>
  );
};
