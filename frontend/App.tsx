import React, { useState, useCallback, useEffect, useRef } from 'react';
import Header from './components/Header.tsx';
import ModeSelector from './components/ModeSelector.tsx';
import DocumentInput from './components/DocumentInput.tsx';
import ResultDisplay from './components/ResultDisplay.tsx';
import SettingsModal from './components/SettingsModal.tsx';
import { AnalysisMode, AnalysisState, PaperFile, AIProvider, ProviderSettings } from './types.ts';
import { analyzePaperStream } from './services/apiService.ts';
import { Play } from 'lucide-react';

const DEFAULT_SETTINGS: ProviderSettings = {
  provider: AIProvider.VERTEX,
  model: 'gemini-3.8-flash',
  apiKey: '',
  baseUrl: ''
};

const DEFAULT_LEFT_PANE_PERCENT = 40;
const MIN_LEFT_PANE_PERCENT = 10;
const MAX_LEFT_PANE_PERCENT = 62;

const App: React.FC = () => {
  const [mode, setMode] = useState<AnalysisMode>(AnalysisMode.AUTHOR);
  const [files, setFiles] = useState<PaperFile[]>([]);
  const [manualText, setManualText] = useState<string>('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [leftPanePercent, setLeftPanePercent] = useState(DEFAULT_LEFT_PANE_PERCENT);
  const [isResizing, setIsResizing] = useState(false);
  const columnsRef = useRef<HTMLDivElement>(null);
  const resizeFrameRef = useRef<number | null>(null);
  
  const [settings, setSettings] = useState<ProviderSettings>(DEFAULT_SETTINGS);

  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    isAnalyzing: false,
    result: '',
    error: null,
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('scholarLensSettings');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved settings");
      }
    }
  }, []);

  const handleSaveSettings = (newSettings: ProviderSettings) => {
    setSettings(newSettings);
    localStorage.setItem('scholarLensSettings', JSON.stringify(newSettings));
  };

  const handleResultChange = useCallback((newResult: string) => {
    setAnalysisState(prev => ({ ...prev, result: newResult }));
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (files.length === 0 && !manualText.trim()) {
      setAnalysisState(prev => ({ ...prev, error: "Please provide at least one document or some text to analyze." }));
      return;
    }

    setAnalysisState({
      isAnalyzing: true,
      result: '',
      error: null,
    });

    await analyzePaperStream(
      files,
      manualText,
      mode,
      settings,
      (chunk) => {
        setAnalysisState((prev) => ({
          ...prev,
          result: prev.result + chunk,
        }));
      },
      (errorMsg) => {
        setAnalysisState((prev) => ({
          ...prev,
          isAnalyzing: false,
          error: errorMsg,
        }));
      },
      () => {
        setAnalysisState((prev) => ({
          ...prev,
          isAnalyzing: false,
        }));
      }
    );
  }, [files, manualText, mode, settings]);

  const isReadyToAnalyze = files.length > 0 || manualText.trim().length > 0;

  const updatePaneWidth = useCallback((clientX: number) => {
    if (resizeFrameRef.current !== null) {
      cancelAnimationFrame(resizeFrameRef.current);
    }

    resizeFrameRef.current = requestAnimationFrame(() => {
      const columns = columnsRef.current;
      if (!columns) return;

      const bounds = columns.getBoundingClientRect();
      const nextPercent = ((clientX - bounds.left) / bounds.width) * 100;
      setLeftPanePercent(Math.min(MAX_LEFT_PANE_PERCENT, Math.max(MIN_LEFT_PANE_PERCENT, nextPercent)));
      resizeFrameRef.current = null;
    });
  }, []);

  const handleResizeStart = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsResizing(true);
    updatePaneWidth(event.clientX);
  }, [updatePaneWidth]);

  const handleResizeMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!isResizing) return;
    updatePaneWidth(event.clientX);
  }, [isResizing, updatePaneWidth]);

  const handleResizeEnd = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setIsResizing(false);
  }, []);

  const handleResizeKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight' && event.key !== 'Home') return;
    event.preventDefault();

    setLeftPanePercent(current => {
      if (event.key === 'Home') return DEFAULT_LEFT_PANE_PERCENT;
      const delta = event.key === 'ArrowLeft' ? -2 : 2;
      return Math.min(MAX_LEFT_PANE_PERCENT, Math.max(MIN_LEFT_PANE_PERCENT, current + delta));
    });
  }, []);

  useEffect(() => () => {
    if (resizeFrameRef.current !== null) cancelAnimationFrame(resizeFrameRef.current);
  }, []);

  return (
    <div className="flex flex-col h-full bg-slate-100 print:bg-white print:h-auto">
      <div className="print:hidden shrink-0">
        <Header onOpenSettings={() => setIsSettingsOpen(true)} />
      </div>
      
      {/* 核心修复：使用 md 断点，确保在笔记本屏幕上保持左右分栏。添加 min-h-0 防止 flex 子元素溢出 */}
      <main className="flex-1 overflow-y-auto md:overflow-hidden p-4 md:p-6 print:p-0 print:overflow-visible print:h-auto min-h-0">
        <div
          ref={columnsRef}
          className={`max-w-[1800px] w-full mx-auto h-auto md:h-full flex flex-col md:flex-row print:block print:h-auto ${isResizing ? 'select-none' : ''}`}
          style={{ '--left-pane-width': `${leftPanePercent}%` } as React.CSSProperties}
        >
          
          {/* Left Column: Input & Controls (独立滚动) */}
          <div className="w-full md:basis-[var(--left-pane-width)] md:flex-none flex flex-col gap-4 md:h-full md:overflow-y-auto md:pr-2 pb-2 print:hidden min-h-0 will-change-[flex-basis] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm shrink-0">
              <ModeSelector 
                currentMode={mode} 
                onModeChange={setMode} 
                disabled={analysisState.isAnalyzing} 
              />
            </div>
            
            <div className="flex-1 flex flex-col min-h-[400px] shrink-0">
              <DocumentInput 
                files={files}
                onFilesChange={setFiles}
                manualText={manualText}
                onManualTextChange={setManualText}
                disabled={analysisState.isAnalyzing}
              />
            </div>

            <button
              onClick={handleAnalyze}
              disabled={analysisState.isAnalyzing || !isReadyToAnalyze}
              className="w-full py-4 px-6 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary-600 disabled:hover:shadow-md shrink-0"
            >
              {analysisState.isAnalyzing ? (
                <>Analyzing {files.length > 0 ? `${files.length} Document(s)` : 'Text'}...</>
              ) : (
                <>
                  <Play size={20} fill="currentColor" />
                  Start Analysis
                </>
              )}
            </button>
          </div>

          {/* Desktop resize handle. Its wide hit area keeps dragging easy while the visible rule stays subtle. */}
          <div
            role="separator"
            aria-label="Resize input and results panels"
            aria-orientation="vertical"
            aria-valuemin={MIN_LEFT_PANE_PERCENT}
            aria-valuemax={MAX_LEFT_PANE_PERCENT}
            aria-valuenow={Math.round(leftPanePercent)}
            tabIndex={0}
            title="Drag to resize · Double-click to reset"
            onPointerDown={handleResizeStart}
            onPointerMove={handleResizeMove}
            onPointerUp={handleResizeEnd}
            onPointerCancel={handleResizeEnd}
            onDoubleClick={() => setLeftPanePercent(DEFAULT_LEFT_PANE_PERCENT)}
            onKeyDown={handleResizeKeyDown}
            className={`hidden md:flex w-7 shrink-0 self-stretch cursor-col-resize touch-none items-center justify-center group outline-none relative ${isResizing ? 'cursor-col-resize' : ''}`}
          >
            <div className={`absolute inset-y-2 left-1/2 w-px -translate-x-1/2 transition-colors duration-150 ${isResizing ? 'bg-primary-400' : 'bg-slate-300 group-hover:bg-primary-300'}`} />
            <div className={`relative z-10 flex h-16 w-3 items-center justify-center rounded-full border bg-white shadow-sm transition-[height,width,border-color,background-color,box-shadow] duration-150 group-hover:h-20 group-focus-visible:ring-4 group-focus-visible:ring-primary-100 ${isResizing ? 'h-24 w-4 border-primary-500 bg-primary-50 shadow-md' : 'border-slate-300 group-hover:border-primary-400'}`}>
              <div className={`h-8 w-1 rounded-full transition-colors ${isResizing ? 'bg-primary-500' : 'bg-slate-400 group-hover:bg-primary-500'}`} />
            </div>
          </div>

          {/* Right Column: Results (独立滚动) */}
          <div className="w-full md:flex-1 flex flex-col min-h-[500px] md:min-h-0 md:h-full overflow-hidden print:w-full print:block print:h-auto print:min-h-0 min-w-0">
            <ResultDisplay 
              isAnalyzing={analysisState.isAnalyzing}
              result={analysisState.result}
              error={analysisState.error}
              onResultChange={handleResultChange}
            />
          </div>

        </div>
      </main>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        settings={settings}
        onSave={handleSaveSettings}
      />
    </div>
  );
};

export default App;
