import React from 'react';
import { Link } from 'react-router-dom';
import LanguageSwitcher from './LanguageSwitcher.tsx';

interface HeaderProps {
  currentTheme: string;
  onThemeChange: (theme: string) => void;
}

export default function Header({ currentTheme, onThemeChange }: HeaderProps) {
  return (
    <header className="w-full h-12 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-3 flex items-center justify-between shadow-2xs shrink-0 z-50">
      <div className="flex items-center gap-2">
        <Link to="/home" className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50/50 dark:bg-indigo-950/40 border border-indigo-100/80 dark:border-indigo-900/40 rounded-lg hover:bg-indigo-100/50 transition-colors">
          <span className="font-extrabold text-xs text-sky-600 dark:text-sky-400 tracking-tight">Walmart</span>
          <span className="flex items-center">
            <svg viewBox="0 0 100 100" width="12" height="12">
              <g transform="translate(50,50)" stroke="#FFC220" strokeWidth="15" strokeLinecap="round">
                <line x1="0" y1="-10" x2="0" y2="-38" />
                <line x1="0" y1="-10" x2="0" y2="-38" transform="rotate(60)" />
                <line x1="0" y1="-10" x2="0" y2="-38" transform="rotate(120)" />
                <line x1="0" y1="-10" x2="0" y2="-38" transform="rotate(180)" />
                <line x1="0" y1="-10" x2="0" y2="-38" transform="rotate(240)" />
                <line x1="0" y1="-10" x2="0" y2="-38" transform="rotate(300)" />
              </g>
            </svg>
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-1.5">
        <button 
          onClick={() => onThemeChange(currentTheme === 'orange' ? 'red' : 'orange')}
          className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-[11px] font-semibold rounded-lg transition-all cursor-pointer"
          title="Toggle theme Classic / Modern"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${currentTheme === 'orange' ? 'bg-amber-500 shadow-[0_0_8px_#f59e0b]' : 'bg-sky-500 shadow-[0_0_8px_#0284c7]'}`} />
          <span className="uppercase text-[9px] tracking-wider font-bold">{currentTheme === 'orange' ? 'Classic' : 'Modern'}</span>
        </button>

        <LanguageSwitcher />

        {/* Discreet link to Admin Portal for administrators */}
        <a 
          href="/admin.html"
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Admin Portal"
          aria-label="Admin Portal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </a>
      </div>
    </header>
  );
}
