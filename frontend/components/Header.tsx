import React from 'react';
import { BookOpen, Sparkles, Settings, Languages } from 'lucide-react';
import { useLanguage } from '../i18n.tsx';

interface HeaderProps {
  onOpenSettings: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenSettings }) => {
  const { language, setLanguage, t } = useLanguage();
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
          <p className="text-xs text-slate-500 font-medium">{t('subtitle')}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-sm text-slate-400 hidden md:block">
          {t('localClient')}
        </div>
        <label className="flex items-center gap-1.5 text-slate-500" title={t('language')}>
          <Languages size={18} />
          <select
            value={language}
            onChange={(event) => setLanguage(event.target.value as 'zh' | 'en')}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm text-slate-700 outline-none hover:border-primary-300 focus:ring-2 focus:ring-primary-100 focus:border-primary-400 cursor-pointer"
            aria-label={t('language')}
          >
            <option value="zh">中文</option>
            <option value="en">English</option>
          </select>
        </label>
        <button 
          onClick={onOpenSettings}
          className="p-2 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-colors"
          title={t('settings')}
        >
          <Settings size={20} />
        </button>
      </div>
    </header>
  );
};

export default Header;
