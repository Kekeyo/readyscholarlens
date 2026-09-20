import React, { useState, useRef, useEffect } from 'react';
import { Loader2, AlertCircle, CheckCircle2, Copy, Download, FileText, FileCode, Printer, ChevronDown, Edit3, Save, X } from 'lucide-react';
import { useLanguage } from '../i18n.tsx';

// Declare globals loaded via <script> tags in index.html
declare const marked: any;
declare const katex: any;

interface ResultDisplayProps {
  isAnalyzing: boolean;
  result: string;
  error: string | null;
  onResultChange: (newResult: string) => void;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ isAnalyzing, result, error, onResultChange }) => {
  const { t } = useLanguage();
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState('');
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const menuRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const copyStatusTimerRef = useRef<number | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => () => {
    if (copyStatusTimerRef.current !== null) {
      window.clearTimeout(copyStatusTimerRef.current);
    }
  }, []);

  const handleEditClick = () => {
    setEditedText(result);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    onResultChange(editedText);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(result);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = result;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        const copied = document.execCommand('copy');
        document.body.removeChild(textarea);
        if (!copied) throw new Error('Clipboard copy failed');
      }
      setCopyStatus('success');
    } catch (err) {
      console.error('Copy failed', err);
      setCopyStatus('error');
    }

    if (copyStatusTimerRef.current !== null) {
      window.clearTimeout(copyStatusTimerRef.current);
    }
    copyStatusTimerRef.current = window.setTimeout(() => setCopyStatus('idle'), 2000);
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const handleExportMarkdown = () => {
    downloadFile(result, 'ScholarLens_Analysis.md', 'text/markdown');
  };

  const handleExportText = () => {
    downloadFile(result, 'ScholarLens_Analysis.txt', 'text/plain');
  };

  const handleExportPDF = () => {
    setShowExportMenu(false);
    
    // @ts-ignore
    if (typeof window === 'undefined' || !window.html2pdf) {
      alert(t('pdfLibraryLoading'));
      return;
    }

    setIsGeneratingPDF(true);
    
    try {
      const element = document.getElementById('pdf-content');
      if (!element) throw new Error("Content element not found");

      const opt = {
        margin:       [15, 15, 15, 15], // top, left, bottom, right
        filename:     'ScholarLens_Analysis.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { 
          scale: 2, 
          useCORS: true, 
          logging: false,
          scrollX: 0,
          scrollY: 0
        },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak:    { mode: ['css', 'legacy'], avoid: ['tr', 'li', 'p', 'h1', 'h2', 'h3', 'pre', 'img'] }
      };

      // @ts-ignore
      window.html2pdf().set(opt).from(element).save().then(() => {
        setIsGeneratingPDF(false);
      }).catch((err: any) => {
        console.error("PDF generation failed", err);
        setIsGeneratingPDF(false);
        alert(t('pdfFailed'));
      });
      
    } catch (err) {
      console.error("PDF generation failed", err);
      setIsGeneratingPDF(false);
      alert(t('pdfFailed'));
    }
  };

  // 核心修复：预处理 Markdown，保护数学公式不被 marked 错误解析（如将公式内的下划线解析为斜体）
  const renderMarkdown = (text: string) => {
    if (typeof marked === 'undefined' || typeof katex === 'undefined') {
      return { __html: `<p>${t('parserLoading')}</p>` };
    }

    const mathBlocks: { type: 'block' | 'inline', math: string }[] = [];
    let processedText = text;

    // 1. 提取并保护块级公式 $$ ... $$
    processedText = processedText.replace(/\$\$([\s\S]+?)\$\$/g, (match, math) => {
      const id = mathBlocks.length;
      mathBlocks.push({ type: 'block', math });
      return `<math-block id="${id}"></math-block>`;
    });

    // 2. 提取并保护行内公式 $ ... $
    processedText = processedText.replace(/(?<!\$)\$([^$\n]+?)\$(?!\$)/g, (match, math) => {
      const id = mathBlocks.length;
      mathBlocks.push({ type: 'inline', math });
      return `<math-inline id="${id}"></math-inline>`;
    });

    // 3. 解析 Markdown
    let html = marked.parse(processedText) as string;

    // 4. 渲染并还原数学公式
    mathBlocks.forEach((item, index) => {
      try {
        const renderedMath = katex.renderToString(item.math, {
          displayMode: item.type === 'block',
          throwOnError: false,
          output: 'html'
        });
        
        if (item.type === 'block') {
          // marked 可能会把自定义标签包裹在 <p> 中，我们将其替换掉
          html = html.replace(new RegExp(`<p>\\s*<math-block id="${index}"></math-block>\\s*</p>`, 'g'), renderedMath);
          html = html.replace(`<math-block id="${index}"></math-block>`, renderedMath);
        } else {
          html = html.replace(`<math-inline id="${index}"></math-inline>`, renderedMath);
        }
      } catch (e) {
        // 如果 KaTeX 渲染失败，回退为原始文本
        const raw = item.type === 'block' ? `$$${item.math}$$` : `$${item.math}$`;
        html = html.replace(`<math-block id="${index}"></math-block>`, raw);
        html = html.replace(`<math-inline id="${index}"></math-inline>`, raw);
      }
    });

    return { __html: html };
  };

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-red-50 rounded-xl border border-red-100 print:hidden">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-red-800 mb-2">{t('analysisFailed')}</h3>
        <p className="text-red-600 text-sm max-w-md">{error}</p>
      </div>
    );
  }

  if (!isAnalyzing && !result) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50 rounded-xl border border-slate-200 border-dashed print:hidden">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 size={32} className="text-slate-300" />
        </div>
        <h3 className="text-lg font-medium text-slate-600 mb-1">{t('ready')}</h3>
        <p className="text-slate-400 text-sm max-w-sm">
          {t('readyHint')}
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm relative overflow-hidden print:border-none print:shadow-none print:overflow-visible print:h-auto">
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between shrink-0 rounded-t-xl print:hidden">
        <h2 className="font-semibold text-slate-700 flex items-center gap-2">
          {t('results')}
          {isAnalyzing && (
            <span className="flex items-center gap-1 text-xs font-normal text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
              <Loader2 size={12} className="animate-spin" /> {t('generating')}
            </span>
          )}
          {isEditing && (
            <span className="flex items-center gap-1 text-xs font-normal text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              {t('editingMode')}
            </span>
          )}
        </h2>

        <div className="flex items-center gap-2">
          {/* Edit / Save Buttons */}
          {result && !isAnalyzing && !isEditing && (
            <button
              onClick={handleEditClick}
              className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-md text-sm font-medium transition-colors shadow-sm"
            >
              <Edit3 size={16} />
              {t('edit')}
            </button>
          )}

          {result && !isAnalyzing && !isEditing && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-md text-sm font-medium transition-colors shadow-sm"
              aria-live="polite"
            >
              {copyStatus === 'success' ? <CheckCircle2 size={16} className="text-emerald-600" /> : <Copy size={16} />}
              {copyStatus === 'success' ? t('copied') : copyStatus === 'error' ? t('copyFailed') : t('copy')}
            </button>
          )}

          {isEditing && (
            <>
              <button
                onClick={handleCancelEdit}
                className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-3 py-1.5 rounded-md text-sm font-medium transition-colors shadow-sm"
              >
                <X size={16} />
                {t('cancel')}
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors shadow-sm"
              >
                <Save size={16} />
                {t('save')}
              </button>
            </>
          )}

          {/* Export Menu */}
          {result && !isAnalyzing && !isEditing && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                disabled={isGeneratingPDF}
                className="flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-md text-sm font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingPDF ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                {isGeneratingPDF ? t('generatingPdf') : t('export')}
                {!isGeneratingPDF && <ChevronDown size={14} className={`transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />}
              </button>

              {showExportMenu && !isGeneratingPDF && (
                <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1 overflow-hidden">
                  <button
                    onClick={handleExportMarkdown}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary-600 transition-colors text-left"
                  >
                    <FileCode size={16} /> Markdown (.md)
                  </button>
                  <button
                    onClick={handleExportText}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary-600 transition-colors text-left"
                  >
                    <FileText size={16} /> {t('plainText')}
                  </button>
                  <div className="h-px bg-slate-100 my-1"></div>
                  <button
                    onClick={handleExportPDF}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary-600 transition-colors text-left"
                  >
                    <Printer size={16} /> {t('savePdf')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className={`flex-1 overflow-y-auto print:overflow-visible print:p-0 print:h-auto bg-white ${isEditing ? 'p-0' : 'p-6'}`}>
        {isEditing ? (
          <textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            className="w-full h-full p-6 font-mono text-sm text-slate-700 resize-none outline-none bg-slate-50/50"
            spellCheck={false}
          />
        ) : result ? (
          <div id="pdf-content" className="bg-white" ref={contentRef}>
            <div 
              className="markdown-body px-4 py-2" 
              dangerouslySetInnerHTML={renderMarkdown(result)} 
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4 print:hidden">
             <Loader2 size={40} className="animate-spin text-primary-500" />
             <p>{t('initAnalysis')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultDisplay;
