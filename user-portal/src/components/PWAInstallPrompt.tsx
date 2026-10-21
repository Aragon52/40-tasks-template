import React, { useState, useEffect } from 'react';

declare global {
  interface Window {
    deferredPrompt?: any;
    MSStream?: any;
  }
  interface Navigator {
    standalone?: boolean;
  }
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isStandalone) return;

    const isDismissed = localStorage.getItem('cb_pwa_dismissed') === 'true';
    if (isDismissed) return;

    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isIosDevice);

    if (window.deferredPrompt) {
      setDeferredPrompt(window.deferredPrompt);
      const timer = setTimeout(() => setShowPrompt(true), 1500);
      return () => clearTimeout(timer);
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      window.deferredPrompt = e;
      setDeferredPrompt(e);
      const timer = setTimeout(() => setShowPrompt(true), 1500);
      return () => clearTimeout(timer);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    const handleForceShow = () => {
      setShowPrompt(true);
    };
    window.addEventListener('pwa-force-show-prompt', handleForceShow);

    if (isIosDevice) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3500);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('pwa-force-show-prompt', handleForceShow);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response: ${outcome}`);
    window.deferredPrompt = null;
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('cb_pwa_dismissed', 'true');
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed inset-0 z-[10000] bg-slate-950/40 backdrop-blur-xs flex items-end justify-center p-4" onClick={() => setShowPrompt(false)}>
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-5 relative animate-in slide-in-from-bottom-5 duration-200 space-y-4" onClick={(e) => e.stopPropagation()}>
        <button onClick={handleDismiss} className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center text-xs font-bold transition-colors cursor-pointer">✕</button>

        <div className="flex gap-3.5 items-center">
          <div className="w-14 h-14 rounded-xl overflow-hidden shadow-md border border-slate-200 dark:border-slate-800 bg-white shrink-0">
            <img src="/icon-192.png" alt="Walmart App Icon" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold text-slate-900 dark:text-white">Walmart App</span>
            <span className="text-xs font-semibold text-amber-500">4.9 ★★★★★ (120K+ reviews)</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Fast • Secure • Official PWA</span>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Install the official Walmart application on your device for lightning-fast order matching, push alerts, and optimal secure routing.
        </p>

        {isIOS ? (
          <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 rounded-xl space-y-2 text-xs text-slate-700 dark:text-slate-300">
            <span className="font-bold text-indigo-600 dark:text-indigo-400 block uppercase tracking-wider text-[10px]">How to Install on iPhone / iPad:</span>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Tap <strong>Share</strong> button 📤 in Safari.</li>
              <li>Scroll and select <strong>Add to Home Screen</strong> ➕.</li>
              <li>Tap <strong>Add</strong> in top right to install.</li>
            </ol>
          </div>
        ) : (
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={handleDismiss} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 transition-colors cursor-pointer">
              Later
            </button>
            <button onClick={handleInstallClick} className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold shadow-sm transition-all cursor-pointer">
              Install Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
