import React from 'react';
import { AnalysisMode } from '../types.ts';
import { User, Compass } from 'lucide-react';

interface ModeSelectorProps {
  currentMode: AnalysisMode;
  onModeChange: (mode: AnalysisMode) => void;
  disabled?: boolean;
}

const ModeSelector: React.FC<ModeSelectorProps> = ({ currentMode, onModeChange, disabled = false }) => {
  return (
    <div className="flex flex-col gap-2 mb-6">
      <label className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
        Select Analysis Mode
      </label>
      <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
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
          <span>同老师类型 (Author Style)</span>
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
          <span>同方向论文 (Research Direction)</span>
        </button>
      </div>
      <p className="text-xs text-slate-500 mt-1 ml-1">
        {currentMode === AnalysisMode.AUTHOR 
          ? "Extracts the author's unique writing style, methodologies, and academic signature."
          : "Analyzes the core research problem, contributions, and future trends of the field."}
      </p>
    </div>
  );
};

export default ModeSelector;