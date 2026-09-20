import React from 'react';
import { AnalysisMode } from '../types.ts';
import { User, Compass, FileSearch } from 'lucide-react';
import { useLanguage } from '../i18n.tsx';

interface ModeSelectorProps {
  currentMode: AnalysisMode;
  onModeChange: (mode: AnalysisMode) => void;
  disabled?: boolean;
}

const ModeSelector: React.FC<ModeSelectorProps> = ({ currentMode, onModeChange, disabled = false }) => {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col gap-2 mb-6">
      <label className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
        {t('selectMode')}
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-3 bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1">
        <button
          onClick={() => onModeChange(AnalysisMode.AUTHOR)}
          disabled={disabled}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
            currentMode === AnalysisMode.AUTHOR
              ? 'bg-white text-primary-700 shadow-sm border border-slate-200/50'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <User size={18} />
          <span>{t('authorMode')}</span>
        </button>
        <button
          onClick={() => onModeChange(AnalysisMode.DIRECTION)}
          disabled={disabled}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
            currentMode === AnalysisMode.DIRECTION
              ? 'bg-white text-primary-700 shadow-sm border border-slate-200/50'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Compass size={18} />
          <span>{t('directionMode')}</span>
        </button>
        <button
          onClick={() => onModeChange(AnalysisMode.SINGLE_PAPER)}
          disabled={disabled}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
            currentMode === AnalysisMode.SINGLE_PAPER
              ? 'bg-white text-primary-700 shadow-sm border border-slate-200/50'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <FileSearch size={18} />
          <span>{t('singlePaperMode')}</span>
        </button>
      </div>
      <p className="text-xs text-slate-500 mt-1 ml-1">
        {currentMode === AnalysisMode.AUTHOR
          ? t('authorDescription')
          : currentMode === AnalysisMode.DIRECTION
            ? t('directionDescription')
            : t('singlePaperDescription')}
      </p>
    </div>
  );
};

export default ModeSelector;
