import React from 'react';
import { Sliders, HelpCircle, Check, Archive, Zap } from 'lucide-react';
import { QualityConfig } from '../types';

interface QualitySettingsProps {
  config: QualityConfig;
  onChange: (newConfig: QualityConfig) => void;
  disabled?: boolean;
}

const PRESETS = [
  { label: '最高原图质量 (100%)', value: 1.0, desc: '画质近乎无损，细节1:1保留' },
  { label: '推荐高质量 (90%)', value: 0.9, desc: '人眼几乎无法察觉差异，体积减少约50-70%' },
  { label: '均衡模式 (80%)', value: 0.8, desc: '适合现代网页与App快速加载' },
  { label: '高压缩 (70%)', value: 0.7, desc: '极致轻量化，大幅节省带宽' },
];

export const QualitySettings: React.FC<QualitySettingsProps> = ({
  config,
  onChange,
  disabled = false,
}) => {
  const currentQualityPercent = Math.round(config.quality * 100);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    onChange({
      ...config,
      quality: val / 100,
    });
  };

  const handlePresetSelect = (val: number) => {
    onChange({
      ...config,
      quality: val,
    });
  };

  return (
    <div id="quality-settings-card" className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-800">转换参数设置</h2>
            <p className="text-xs text-slate-500">可自定义输出质量与自动化打包规则</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700 hover:text-slate-900 transition-colors">
            <input
              id="auto-download-zip-checkbox"
              type="checkbox"
              checked={config.autoDownloadZip}
              disabled={disabled}
              onChange={(e) =>
                onChange({
                  ...config,
                  autoDownloadZip: e.target.checked,
                })
              }
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 transition"
            />
            <span className="flex items-center gap-1 font-medium">
              <Archive className="w-3.5 h-3.5 text-blue-600" />
              全部转换后自动下载 ZIP 压缩包
            </span>
          </label>
        </div>
      </div>

      <div className="pt-4 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Quality presets */}
        <div className="lg:col-span-7">
          <div className="text-xs font-medium text-slate-600 mb-2 flex items-center justify-between">
            <span>预设质量档位</span>
            <span className="text-slate-400">点击快速套用</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PRESETS.map((preset) => {
              const isSelected = Math.abs(config.quality - preset.value) < 0.01;
              return (
                <button
                  key={preset.value}
                  id={`quality-preset-${Math.round(preset.value * 100)}`}
                  type="button"
                  disabled={disabled}
                  onClick={() => handlePresetSelect(preset.value)}
                  className={`px-3 py-2.5 rounded-xl text-left border transition-all text-xs flex flex-col justify-between ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/70 text-blue-900 ring-2 ring-blue-500/20 font-medium'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 text-slate-700 hover:border-slate-300'
                  } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="font-semibold">{Math.round(preset.value * 100)}%</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </div>
                  <span className="text-[11px] text-slate-500 line-clamp-1 leading-snug">
                    {preset.value === 1.0
                      ? '原图画质'
                      : preset.value === 0.9
                      ? '推荐档'
                      : preset.value === 0.8
                      ? '标准'
                      : '极小体积'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quality custom slider */}
        <div className="lg:col-span-5 bg-slate-50/70 rounded-xl p-3.5 border border-slate-200/60">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-medium text-slate-700 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              自定义图片质量:
            </span>
            <span className="font-bold text-sm px-2 py-0.5 rounded-md bg-white border border-slate-200 text-blue-600 tabular-nums shadow-2xs">
              {currentQualityPercent}%
            </span>
          </div>

          <input
            id="quality-slider"
            type="range"
            min="10"
            max="100"
            step="1"
            value={currentQualityPercent}
            disabled={disabled}
            onChange={handleSliderChange}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 transition"
          />

          <div className="flex justify-between text-[10px] text-slate-400 mt-1.5">
            <span>10% (高压缩)</span>
            <span>50%</span>
            <span>90% (推荐)</span>
            <span>100% (最高原质)</span>
          </div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs text-slate-500">
        <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span>
          转换过程会完整保留 PNG 原图的<strong>透明通道 (Alpha Channel)</strong> 及<strong>分辨率尺寸</strong>，支持随时无损切换。
        </span>
      </div>
    </div>
  );
};
