import React from 'react';
import {
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  FileArchive,
  RefreshCw,
  Play,
  TrendingDown,
} from 'lucide-react';
import { ImageItem } from '../types';
import { formatBytes } from '../utils/imageConverter';

interface BatchStatusBarProps {
  items: ImageItem[];
  isConverting: boolean;
  isZipping: boolean;
  zipProgress: number;
  zipBlob: Blob | null;
  onStartConvert: () => void;
  onDownloadZip: () => void;
  onClearAll: () => void;
}

export const BatchStatusBar: React.FC<BatchStatusBarProps> = ({
  items,
  isConverting,
  isZipping,
  zipProgress,
  zipBlob,
  onStartConvert,
  onDownloadZip,
  onClearAll,
}) => {
  if (items.length === 0) return null;

  const totalCount = items.length;
  const completedCount = items.filter((i) => i.status === 'completed').length;
  const errorCount = items.filter((i) => i.status === 'error').length;
  const idleCount = items.filter((i) => i.status === 'idle').length;

  const totalOriginalSize = items.reduce((acc, i) => acc + i.originalSize, 0);
  const completedItems = items.filter((i) => i.status === 'completed' && i.webpSize);
  const totalWebpSize = completedItems.reduce((acc, i) => acc + (i.webpSize || 0), 0);
  const totalOriginalForCompleted = completedItems.reduce((acc, i) => acc + i.originalSize, 0);

  const savedBytes = totalOriginalForCompleted - totalWebpSize;
  const savedPercent =
    totalOriginalForCompleted > 0
      ? Math.round(((totalOriginalForCompleted - totalWebpSize) / totalOriginalForCompleted) * 100)
      : 0;

  // Calculate overall percentage
  let progressPercent = 0;
  if (isZipping) {
    progressPercent = zipProgress;
  } else if (totalCount > 0) {
    const itemProgressSum = items.reduce((acc, i) => {
      if (i.status === 'completed') return acc + 100;
      if (i.status === 'converting') return acc + (i.progress || 20);
      if (i.status === 'error') return acc + 100;
      return acc;
    }, 0);
    progressPercent = Math.round(itemProgressSum / totalCount);
  }

  const isAllFinished = completedCount + errorCount === totalCount && totalCount > 0;

  return (
    <div id="batch-status-bar" className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden transition-all">
      {/* Top action row */}
      <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-800">
                转换任务清单 ({items.length} 张图片)
              </span>
              {isAllFinished && completedCount > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" />
                  已就绪
                </span>
              )}
            </div>
            <span className="text-xs text-slate-500">
              {isConverting
                ? `正在转换中，已完成 ${completedCount}/${totalCount}`
                : isZipping
                ? '正在生成 ZIP 压缩文件...'
                : isAllFinished
                ? `全部完成 (${completedCount} 成功${errorCount > 0 ? `，${errorCount} 失败` : ''})`
                : `${idleCount} 张等待转换`}
            </span>
          </div>
        </div>

        {/* Action button cluster */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Clear button */}
          <button
            id="clear-all-btn"
            type="button"
            disabled={isConverting || isZipping}
            onClick={onClearAll}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-800 rounded-xl transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-3.5 h-3.5 text-slate-400" />
            清空列表
          </button>

          {/* Start convert or retry */}
          {idleCount > 0 ? (
            <button
              id="start-convert-btn"
              type="button"
              disabled={isConverting || isZipping}
              onClick={onStartConvert}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              {isConverting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  正在处理...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  开始批量转换
                </>
              )}
            </button>
          ) : (
            <button
              id="retry-convert-btn"
              type="button"
              disabled={isConverting || isZipping}
              onClick={onStartConvert}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              重新全部转换
            </button>
          )}

          {/* Download all as zip */}
          <button
            id="download-all-zip-btn"
            type="button"
            disabled={completedCount === 0 || isConverting || isZipping}
            onClick={onDownloadZip}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition shadow-xs cursor-pointer ${
              completedCount > 0 && !isConverting && !isZipping
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-500/20'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200/60'
            }`}
          >
            {isZipping ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                正在打包 ZIP ({zipProgress}%)...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                一键下载全部 (ZIP)
                {zipBlob && (
                  <span className="text-[10px] font-normal opacity-90 px-1.5 py-0.5 rounded bg-emerald-700/60">
                    {formatBytes(zipBlob.size)}
                  </span>
                )}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Progress bar line */}
      <div id="overall-progress-bar-container" className="relative w-full bg-slate-100 h-2">
        <div
          id="overall-progress-bar"
          className={`h-full transition-all duration-300 ${
            isAllFinished ? 'bg-emerald-500' : 'bg-blue-600'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Stats footer bar */}
      <div className="bg-slate-50/70 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">总大小:</span>
            <span className="font-semibold text-slate-700">{formatBytes(totalOriginalSize)}</span>
          </div>

          {completedCount > 0 && (
            <>
              <span className="text-slate-300">→</span>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">WebP 转换后:</span>
                <span className="font-semibold text-blue-600">{formatBytes(totalWebpSize)}</span>
              </div>

              {savedBytes > 0 && (
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                  <TrendingDown className="w-3.5 h-3.5" />
                  已节省 {savedPercent}% ({formatBytes(savedBytes)})
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-2 text-slate-500">
          <span>进度: {progressPercent}%</span>
          <span>·</span>
          <span>
            {completedCount}/{totalCount} 完成
          </span>
        </div>
      </div>
    </div>
  );
};
