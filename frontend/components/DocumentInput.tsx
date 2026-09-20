import React, { useRef, useState, useCallback } from 'react';
import { Upload, FolderUp, FileText, File as FileIcon, Trash2, X, Loader2, PlusCircle, Inbox, AlertTriangle } from 'lucide-react';
import { PaperFile } from '../types.ts';
import { useLanguage } from '../i18n.tsx';

interface DocumentInputProps {
  files: PaperFile[];
  onFilesChange: (files: PaperFile[]) => void;
  manualText: string;
  onManualTextChange: (text: string) => void;
  disabled?: boolean;
}

const DocumentInput: React.FC<DocumentInputProps> = ({ 
  files, 
  onFilesChange, 
  manualText, 
  onManualTextChange, 
  disabled = false 
}) => {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

  const processFiles = async (selectedFiles: FileList | File[]) => {
    const filesArray = Array.from(selectedFiles);
    
    if (filesArray.length === 0) return;
    
    setIsProcessing(true);
    setProgress({ current: 0, total: filesArray.length });
    const newFiles: PaperFile[] = [];
    
    try {
      for (let i = 0; i < filesArray.length; i++) {
        const file = filesArray[i];
        setProgress({ current: i + 1, total: filesArray.length });
        
        const isMD = file.name.toLowerCase().endsWith('.md') || file.name.toLowerCase().endsWith('.txt');
        const isPDF = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';

        if (!isMD && !isPDF) continue;

        const fileType = isMD ? 'md' : 'pdf';
        if (files.some(f => f.name === file.name && f.type === fileType) || 
            newFiles.some(f => f.name === file.name && f.type === fileType)) {
          continue;
        }

        try {
          if (isMD) {
            const text = await file.text();
            newFiles.push({ 
              id: generateId(), 
              name: file.name, 
              type: 'md', 
              content: text, 
              mimeType: 'text/plain' 
            });
          } else if (isPDF) {
            const base64 = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = (e) => {
                const result = e.target?.result as string;
                resolve(result.split(',')[1]);
              };
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });
            newFiles.push({ 
              id: generateId(), 
              name: file.name, 
              type: 'pdf', 
              content: base64, 
              mimeType: 'application/pdf' 
            });
          }
        } catch (fileError) {
          console.error(`Failed to read file ${file.name}:`, fileError);
        }
      }
      
      if (newFiles.length > 0) {
        onFilesChange([...files, ...newFiles]);
      }
    } catch (error) {
      console.error("Error processing files:", error);
      alert(t('fileReadError'));
    } finally {
      setIsProcessing(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      processFiles(event.target.files);
    }
    event.target.value = ''; 
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [disabled, files]);

  const removeFile = (idToRemove: string) => {
    onFilesChange(files.filter(f => f.id !== idToRemove));
  };

  const clearAllFiles = () => {
    if (window.confirm(t('clearConfirm'))) {
      onFilesChange([]);
    }
  };

  const hasPdf = files.some(f => f.type === 'pdf');

  return (
    <div className="flex flex-col h-full flex-1 gap-4">
      {/* File Upload Section */}
      <div className="flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1 max-h-[50vh]">
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between shrink-0">
          <label className="text-sm font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            {t('documents')}
            <span className="bg-primary-100 text-primary-700 py-0.5 px-2 rounded-full text-xs font-bold">
              {files.length}
            </span>
          </label>
          <div className="flex gap-2">
            {files.length > 0 && (
              <button
                onClick={clearAllFiles}
                disabled={disabled || isProcessing}
                className="text-xs flex items-center gap-1 text-slate-500 hover:text-red-600 transition-colors px-2 py-1 rounded disabled:opacity-50"
                title={t('clearAll')}
              >
                <Trash2 size={14} /> {t('clearAll')}
              </button>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isProcessing}
              className="text-xs flex items-center gap-1 bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-md transition-colors border border-slate-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <Upload size={14} /> {t('addFiles')}
            </button>
            <button
              onClick={() => folderInputRef.current?.click()}
              disabled={disabled || isProcessing}
              className="text-xs flex items-center gap-1 bg-primary-50 hover:bg-primary-100 text-primary-700 px-3 py-1.5 rounded-md transition-colors border border-primary-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <FolderUp size={14} /> {t('addFolder')}
            </button>
            
            <input
              type="file"
              multiple
              accept=".md,.txt,.pdf"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <input
              type="file"
              multiple
              ref={folderInputRef}
              onChange={handleFileChange}
              className="hidden"
              {...{ webkitdirectory: "true", directory: "true" } as any}
            />
          </div>
        </div>
        
        <div 
          className={`flex-1 p-3 overflow-y-auto transition-colors duration-200 ${
            isDragging ? 'bg-primary-50 border-2 border-primary-400 border-dashed m-2 rounded-lg' : 'bg-slate-50/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isProcessing ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 py-8">
              <Loader2 size={32} className="animate-spin mb-3 text-primary-500" />
              <p className="text-sm font-medium">{t('processingFiles')}</p>
              <p className="text-xs mt-1 text-slate-400">{progress.current} / {progress.total}</p>
              <div className="w-48 h-1.5 bg-slate-200 rounded-full mt-3 overflow-hidden">
                <div 
                  className="h-full bg-primary-500 transition-all duration-300" 
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                ></div>
              </div>
            </div>
          ) : files.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-10 opacity-80 pointer-events-none">
              <Inbox size={48} className="mb-3 text-slate-300" />
              <p className="text-base font-medium text-slate-600">{t('dragFiles')}</p>
              <p className="text-sm mt-1">{t('fileSupport')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {hasPdf && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-2 rounded-lg flex items-start gap-2 mb-2">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  <p>{t('pdfWarning')}</p>
                </div>
              )}
              <ul className="space-y-1.5">
                {files.map((file, index) => (
                  <li key={file.id} className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm group hover:border-primary-300 transition-colors">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <span className="text-xs font-mono text-slate-400 w-4">{index + 1}.</span>
                      {file.type === 'pdf' ? (
                        <div className="bg-red-100 text-red-600 p-1.5 rounded-md shrink-0">
                          <FileIcon size={16} />
                        </div>
                      ) : (
                        <div className="bg-blue-100 text-blue-600 p-1.5 rounded-md shrink-0">
                          <FileText size={16} />
                        </div>
                      )}
                      <span className="text-sm text-slate-700 font-medium truncate" title={file.name}>
                        {file.name}
                      </span>
                    </div>
                    <button
                      onClick={() => removeFile(file.id)}
                      disabled={disabled}
                      className="text-slate-400 hover:text-red-500 p-1.5 rounded-md hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-0 shrink-0"
                      title={t('removeFile')}
                    >
                      <X size={16} />
                    </button>
                  </li>
                ))}
              </ul>
              
              {!disabled && (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 mt-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:text-primary-600 hover:border-primary-300 hover:bg-primary-50 transition-all flex items-center justify-center gap-2 text-sm font-medium"
                >
                  <PlusCircle size={16} /> {t('addMoreFiles')}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Manual Text Section */}
      <div className="flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500 transition-all min-h-[120px] shrink-0">
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
            {t('notes')}
          </label>
        </div>
        <textarea
          value={manualText}
          onChange={(e) => onManualTextChange(e.target.value)}
          disabled={disabled}
          placeholder={t('notesPlaceholder')}
          className="flex-1 w-full p-3 bg-transparent resize-none outline-none text-slate-700 font-mono text-sm leading-relaxed disabled:bg-slate-50 disabled:text-slate-500"
          spellCheck={false}
        />
      </div>
    </div>
  );
};

export default DocumentInput;
