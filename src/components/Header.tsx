import React from 'react';
import { ShieldCheck, Sparkles, Image as ImageIcon } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm shadow-blue-500/20">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">PNG 转 WebP 工具</h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                <Sparkles className="w-3 h-3" />
                批量高清
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              批量高画质无损/有损转换 · 保持原图尺寸与透明通道
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-100/80 border border-slate-200/60 px-3 py-1.5 rounded-full">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="font-medium text-slate-700">纯浏览器本地处理</span>
          <span className="text-slate-400 hidden sm:inline">|</span>
          <span className="text-slate-500 hidden sm:inline">文件不上云，严密保护隐私</span>
        </div>
      </div>
    </header>
  );
};
