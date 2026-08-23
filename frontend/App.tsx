import React, { useState, useCallback, useEffect } from 'react';
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
  model: 'gemini-2.5-flash',
  apiKey: '',
  baseUrl: ''
};

const App: React.FC = () => {
  const [mode, setMode] = useState<AnalysisMode>(AnalysisMode.AUTHOR);
  const [files, setFiles] = useState<PaperFile[]>([]);
  const [manualText, setManualText] = useState<string>('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
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

  return (
    <div className="flex flex-col h-full bg-slate-100 print:bg-white print:h-auto">
      <div className="print:hidden shrink-0">
        <Header onOpenSettings={() => setIsSettingsOpen(true)} />
      </div>
      
      {/* 核心修复：使用 md 断点，确保在笔记本屏幕上保持左右分栏。添加 min-h-0 防止 flex 子元素溢出 */}
      <main className="flex-1 overflow-y-auto md:overflow-hidden p-4 md:p-6 print:p-0 print:overflow-visible print:h-auto min-h-0">
        <div className="max-w-7xl mx-auto h-auto md:h-full flex flex-col md:flex-row gap-6 print:block print:h-auto">
          
          {/* Left Column: Input & Controls (独立滚动) */}
          <div className="w-full md:w-5/12 flex flex-col gap-4 md:h-full md:overflow-y-auto pr-2 pb-2 print:hidden min-h-0">
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

          {/* Right Column: Results (独立滚动) */}
          <div className="w-full md:w-7/12 flex flex-col min-h-[500px] md:min-h-0 md:h-full overflow-hidden print:w-full print:block print:h-auto print:min-h-0">
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
