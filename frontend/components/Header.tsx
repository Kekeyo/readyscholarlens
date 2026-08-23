import React from 'react';
import { BookOpen, Sparkles, Settings } from 'lucide-react';

interface HeaderProps {
  onOpenSettings: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenSettings }) => {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0 z-10 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="bg-primary-600 p-2 rounded-lg text-white">
          <BookOpen size={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            ScholarLens <Sparkles size={16} className="text-amber-500" />
          </h1>
          <p className="text-xs text-slate-500 font-medium">AI-Powered Academic Paper Analysis</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-sm text-slate-400 hidden sm:block">
          Local BYOK Client
        </div>
        <button 
          onClick={onOpenSettings}
          className="p-2 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-colors"
          title="AI Provider Settings"
        >
          <Settings size={20} />
        </button>
      </div>
    </header>
  );
};

export default Header;
