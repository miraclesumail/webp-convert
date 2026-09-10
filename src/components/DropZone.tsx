import React, { useState, useRef } from 'react';
import { UploadCloud, ImagePlus, Shield, Sparkles } from 'lucide-react';

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({ onFilesSelected, disabled = false }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files) as File[];
      // Filter primarily for png or image files
      const imageFiles = files.filter(
        (f) => f.type.startsWith('image/') || f.name.toLowerCase().endsWith('.png')
      );
      if (imageFiles.length > 0) {
        onFilesSelected(imageFiles);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files) as File[];
      onFilesSelected(files);
      // Reset input value so re-selecting same files triggers change
      e.target.value = '';
    }
  };

  const handleContainerClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div
      id="dropzone-container"
      onClick={handleContainerClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative group rounded-3xl border-2 border-dashed transition-all duration-200 cursor-pointer overflow-hidden p-8 sm:p-12 text-center ${
        isDragOver
          ? 'border-blue-500 bg-blue-50/70 scale-[0.995] shadow-inner'
          : 'border-slate-300 bg-white hover:border-blue-400 hover:bg-slate-50/70 shadow-xs'
      } ${disabled ? 'opacity-60 pointer-events-none' : ''}`}
    >
      <input
        id="file-upload-input"
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/png,.png,image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />

      <div className="flex flex-col items-center justify-center max-w-md mx-auto pointer-events-none">
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 ${
            isDragOver
              ? 'bg-blue-600 text-white scale-110 shadow-lg shadow-blue-500/30'
              : 'bg-blue-50 text-blue-600 group-hover:bg-blue-100 group-hover:scale-105'
          }`}
        >
          {isDragOver ? (
            <Sparkles className="w-8 h-8 animate-pulse" />
          ) : (
            <UploadCloud className="w-8 h-8" />
          )}
        </div>

        <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-1">
          {isDragOver ? '松开鼠标即可添加图片' : '点击选择图片 或 拖拽 PNG 图片至此处'}
        </h3>

        <p className="text-xs sm:text-sm text-slate-500 mb-4">
          支持多张批量上传，自动保持原图色彩、透明度与分辨率
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">
            <ImagePlus className="w-3.5 h-3.5 text-blue-500" />
            支持批量 PNG / 多选上传
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            不限文件大小 · 速度极快
          </span>
        </div>
      </div>
    </div>
  );
};
