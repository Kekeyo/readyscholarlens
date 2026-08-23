import React, { useRef } from 'react';
import { Upload, FileText, Trash2 } from 'lucide-react';

interface MarkdownInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const MarkdownInput: React.FC<MarkdownInputProps> = ({ value, onChange, disabled = false }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === 'string') {
        onChange(content);
      }
    };
    reader.readAsText(file);
    
    // Reset input so the same file can be uploaded again if cleared
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const clearInput = () => {
    onChange('');
  };

  return (
    <div className="flex flex-col h-full flex-1 min-h-[300px]">
      <div className="flex justify-between items-end mb-2">
        <label className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
          Paper Content (Markdown)
        </label>
        <div className="flex gap-2">
          {value && (
            <button
              onClick={clearInput}
              disabled={disabled}
              className="text-xs flex items-center gap-1 text-slate-500 hover:text-red-600 transition-colors px-2 py-1 rounded"
              title="Clear content"
            >
              <Trash2 size={14} /> Clear
            </button>
          )}
          <button
            onClick={triggerFileInput}
            disabled={disabled}
            className="text-xs flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-md transition-colors border border-slate-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload size={14} /> Upload .md File
          </button>
          <input
            type="file"
            accept=".md,.txt"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>
      
      <div className="relative flex-1 flex flex-col rounded-xl border border-slate-300 bg-white shadow-inner overflow-hidden focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500 transition-all">
        {value.length === 0 && !disabled && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-400 opacity-60">
            <FileText size={48} className="mb-4 text-slate-300" />
            <p>Paste your markdown paper here</p>
            <p className="text-sm mt-1">or use the upload button above</p>
          </div>
        )}
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder=""
          className="flex-1 w-full p-4 bg-transparent resize-none outline-none text-slate-700 font-mono text-sm leading-relaxed disabled:bg-slate-50 disabled:text-slate-500"
          spellCheck={false}
        />
        <div className="bg-slate-50 border-t border-slate-200 px-3 py-1.5 text-xs text-slate-400 flex justify-end">
          {value.length} characters
        </div>
      </div>
    </div>
  );
};

export default MarkdownInput;