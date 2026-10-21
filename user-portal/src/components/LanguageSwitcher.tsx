import React, { useState, useEffect, useRef } from 'react';

interface Language {
  code: string;
  name: string;
  local: string;
  flag: string;
}

const REGIONS: Record<string, Language[]> = {
  'America': [
    { code: 'en', name: 'English', local: 'English', flag: '🇺🇸' }
  ],
  'Europe': [
    { code: 'fr', name: 'French', local: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'German', local: 'Deutsch', flag: '🇩🇪' },
    { code: 'es', name: 'Spanish', local: 'Español', flag: '🇪🇸' },
    { code: 'pt', name: 'Portuguese', local: 'Português', flag: '🇵🇹' },
    { code: 'it', name: 'Italian', local: 'Italiano', flag: '🇮🇹' },
    { code: 'nl', name: 'Dutch', local: 'Nederlands', flag: '🇳🇱' },
    { code: 'sv', name: 'Swedish', local: 'Svenska', flag: '🇸🇪' },
    { code: 'no', name: 'Norwegian', local: 'Norsk', flag: '🇳🇴' },
    { code: 'da', name: 'Danish', local: 'Dansk', flag: '🇩🇰' },
    { code: 'fi', name: 'Finnish', local: 'Suomi', flag: '🇫🇮' },
    { code: 'ru', name: 'Russian', local: 'Русский', flag: '🇷🇺' },
    { code: 'uk', name: 'Ukrainian', local: 'Українська', flag: '🇺🇦' },
    { code: 'pl', name: 'Polish', local: 'Polski', flag: '🇵🇱' },
    { code: 'cs', name: 'Czech', local: 'Čeština', flag: '🇨🇿' },
    { code: 'ro', name: 'Romanian', local: 'Română', flag: '🇷🇴' },
    { code: 'hu', name: 'Hungarian', local: 'Magyar', flag: '🇭🇺' },
    { code: 'bg', name: 'Bulgarian', local: 'Български', flag: '🇧🇬' },
    { code: 'sr', name: 'Serbian', local: 'Српски', flag: '🇷🇸' },
    { code: 'hr', name: 'Croatian', local: 'Hrvatski', flag: '🇭🇷' },
    { code: 'sk', name: 'Slovak', local: 'Slovenčina', flag: '🇸🇰' }
  ],
  'Middle East': [
    { code: 'ar', name: 'Arabic', local: 'العربية', flag: '🇸🇦' },
    { code: 'iw', name: 'Hebrew', local: 'עברית', flag: '🇮🇱' },
    { code: 'fa', name: 'Persian', local: 'فارسی', flag: '🇮🇷' },
    { code: 'tr', name: 'Turkish', local: 'Türkçe', flag: '🇹🇷' }
  ],
  'Asia': [
    { code: 'my', name: 'Burmese', local: 'မြန်မာဘာသာ', flag: '🇲🇲' },
    { code: 'km', name: 'Khmer', local: 'ភាសាខ្មែរ', flag: '🇰🇭' },
    { code: 'lo', name: 'Lao', local: 'ພາສາລາວ', flag: '🇱🇦' },
    { code: 'th', name: 'Thai', local: 'ภาษาไทย', flag: '🇹🇭' },
    { code: 'vi', name: 'Vietnamese', local: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'id', name: 'Indonesian', local: 'Bahasa Indonesia', flag: '🇮🇩' },
    { code: 'ms', name: 'Malay', local: 'Bahasa Melayu', flag: '🇲🇾' },
    { code: 'tl', name: 'Filipino', local: 'Wikang Filipino', flag: '🇵🇭' },
    { code: 'zh-CN', name: 'Chinese (Simplified)', local: '简体中文', flag: '🇨🇳' },
    { code: 'zh-TW', name: 'Chinese (Traditional)', local: '繁體中文', flag: '🇹🇼' },
    { code: 'ja', name: 'Japanese', local: '日本語', flag: '🇯🇵' },
    { code: 'ko', name: 'Korean', local: '한국어', flag: '🇰🇷' },
    { code: 'hi', name: 'Hindi', local: 'हिन्दी', flag: '🇮🇳' },
    { code: 'bn', name: 'Bengali', local: 'বাংলা', flag: '🇧🇩' },
    { code: 'ur', name: 'Urdu', local: 'اردو', flag: '🇵🇰' }
  ]
};

const ALL_LANGUAGES: Language[] = Object.values(REGIONS).flat();

const getFlagUrl = (code: string): string => {
  if (!code) return 'https://flagcdn.com/w40/us.png';
  const mapping: Record<string, string> = {
    'my': 'mm', 'km': 'kh', 'lo': 'la', 'th': 'th', 'vi': 'vn', 'id': 'id', 'ms': 'my', 'tl': 'ph',
    'zh-CN': 'cn', 'zh-TW': 'tw', 'ja': 'jp', 'ko': 'kr',
    'hi': 'in', 'bn': 'bd', 'ur': 'pk',
    'ru': 'ru', 'uk': 'ua', 'pl': 'pl', 'cs': 'cz', 'ro': 'ro', 'hu': 'hu', 'bg': 'bg', 'sr': 'rs', 'hr': 'hr', 'sk': 'sk',
    'ar': 'sa', 'iw': 'il', 'fa': 'ir', 'tr': 'tr',
    'en': 'us', 'fr': 'fr', 'de': 'de', 'es': 'es', 'pt': 'pt', 'it': 'it', 'nl': 'nl', 'sv': 'se', 'no': 'no', 'da': 'dk', 'fi': 'fi'
  };
  const country = mapping[code] || code.split('-')[0].toLowerCase();
  return `https://flagcdn.com/w40/${country}.png`;
};

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: any;
  }
}

export default function LanguageSwitcher() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentLang, setCurrentLang] = useState<string>('en');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getCurrentLangCode = (): string => {
    const saved = localStorage.getItem('user-language');
    if (saved) return saved;
    return 'en';
  };

  useEffect(() => {
    const initialLang = getCurrentLangCode();
    setCurrentLang(initialLang);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectLanguage = (langCode: string) => {
    setCurrentLang(langCode);
    localStorage.setItem('user-language', langCode);
    setIsOpen(false);
  };

  const currentLanguageObj = ALL_LANGUAGES.find(l => l.code === currentLang) || { name: 'English', flag: '🇺🇸', local: 'English' };

  return (
    <div className="relative inline-block z-50" ref={dropdownRef}>
      <button 
        type="button" 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 px-2.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer transition-all"
        title="Choose language"
      >
        <span className="w-5 h-3.5 bg-white rounded overflow-hidden flex items-center justify-center shrink-0 shadow-xs border border-slate-200/50">
          <img 
            src={getFlagUrl(currentLang)} 
            alt={currentLanguageObj.name} 
            className="w-full h-full object-cover" 
            referrerPolicy="no-referrer"
          />
        </span>
        <svg width="8" height="6" viewBox="0 0 8 6" fill="none" className="text-slate-500">
          <path d="M1 1L4 4L7 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 max-h-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="p-2 bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
            <div className="relative flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 h-8">
              <input 
                type="text" 
                placeholder="Search languages..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full text-xs bg-transparent text-slate-900 dark:text-white outline-none placeholder-slate-400"
              />
              {searchQuery && (
                <button type="button" className="text-xs text-slate-400 font-bold ml-1 cursor-pointer" onClick={() => setSearchQuery('')}>×</button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto max-h-60 p-2 space-y-2">
            {searchQuery.trim() !== '' ? (
              <div className="space-y-1">
                {ALL_LANGUAGES.filter(lang => 
                  lang.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  lang.local.toLowerCase().includes(searchQuery.toLowerCase())
                ).map(lang => (
                  <button 
                    key={lang.code}
                    type="button" 
                    onClick={() => handleSelectLanguage(lang.code)}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                      currentLang === lang.code ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-3.5 rounded overflow-hidden shadow-xs border border-slate-200 shrink-0">
                        <img src={getFlagUrl(lang.code)} alt={lang.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </span>
                      <div>
                        <div className="font-semibold">{lang.name}</div>
                        <div className="text-[10px] text-slate-400">{lang.local}</div>
                      </div>
                    </div>
                    {currentLang === lang.code && <span>✓</span>}
                  </button>
                ))}
              </div>
            ) : (
              Object.entries(REGIONS).map(([regionName, langs]) => (
                <div key={regionName} className="space-y-1">
                  <h4 className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider px-2 pt-1">{regionName}</h4>
                  <div className="grid grid-cols-1 gap-1">
                    {langs.map(lang => (
                      <button 
                        key={lang.code}
                        type="button" 
                        onClick={() => handleSelectLanguage(lang.code)}
                        className={`flex items-center gap-2 p-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                          currentLang === lang.code ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <span className="w-5 h-3.5 rounded overflow-hidden shadow-xs border border-slate-200 shrink-0">
                          <img src={getFlagUrl(lang.code)} alt={lang.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </span>
                        <div className="truncate">
                          <div className="font-semibold truncate">{lang.name}</div>
                          <div className="text-[9px] text-slate-400 truncate">{lang.local}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
