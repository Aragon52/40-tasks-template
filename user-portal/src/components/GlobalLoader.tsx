import React, { createContext, useContext, useState, useEffect } from 'react';

interface LoadingContextType {
  isLoading: boolean;
  skeletonType: string;
  showLoading: (type?: string) => void;
  hideLoading: () => void;
  performAsync: <T>(fn: () => Promise<T>, type?: string) => Promise<T>;
}

const LoadingContext = createContext<LoadingContextType>({
  isLoading: false,
  skeletonType: 'general',
  showLoading: () => {},
  hideLoading: () => {},
  performAsync: async (fn) => fn()
});

export const useLoading = () => useContext(LoadingContext);

interface LoadingProviderProps {
  children: React.ReactNode;
}

export function LoadingProvider({ children }: LoadingProviderProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [skeletonType, setSkeletonType] = useState<string>('general');
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const showLoading = (type = 'general') => {
    setSkeletonType(type);
    setIsLoading(true);

    if (timeoutId) clearTimeout(timeoutId);
    const id = setTimeout(() => {
      setIsLoading(false);
    }, 6000);
    setTimeoutId(id);
  };

  const hideLoading = () => {
    setIsLoading(false);
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
  };

  const performAsync = async <T,>(fn: () => Promise<T>, type = 'general'): Promise<T> => {
    showLoading(type);
    try {
      const result = await fn();
      return result;
    } finally {
      hideLoading();
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [timeoutId]);

  return (
    <LoadingContext.Provider value={{ isLoading, skeletonType, showLoading, hideLoading, performAsync }}>
      {children}
      {isLoading && <GlobalLoader type={skeletonType} />}
    </LoadingContext.Provider>
  );
}

interface GlobalLoaderProps {
  type: string;
}

function GlobalLoader({ type }: GlobalLoaderProps) {
  return (
    <div className="fixed inset-0 z-[1000000] bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-start pt-10 overflow-y-auto font-sans animate-in fade-in duration-200">
      <div className="w-full max-w-md p-5 flex flex-col gap-5">
        <div className="inline-flex items-center gap-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 shadow-sm mx-auto">
          <div className="w-3.5 h-3.5 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Fetching live database...</span>
        </div>

        {type === 'home' && (
          <div className="space-y-4 animate-pulse">
            <div className="flex justify-between items-center">
              <div className="w-24 h-7 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
              <div className="w-9 h-9 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
            </div>
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-3">
              <div className="w-1/3 h-4 bg-slate-200 dark:bg-slate-800 rounded"></div>
              <div className="w-2/3 h-9 bg-slate-200 dark:bg-slate-800 rounded"></div>
              <div className="w-1/4 h-3 bg-slate-200 dark:bg-slate-800 rounded"></div>
            </div>
            <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
            <div className="grid grid-cols-4 gap-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
                  <div className="w-10 h-3 bg-slate-200 dark:bg-slate-800 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {type === 'orders' && (
          <div className="space-y-4 animate-pulse">
            <div className="flex justify-between items-center">
              <div className="w-8 h-8 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
              <div className="w-24 h-5 bg-slate-200 dark:bg-slate-800 rounded"></div>
              <div className="w-8 h-8 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-8 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
              ))}
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="w-24 h-3 bg-slate-200 dark:bg-slate-800 rounded"></div>
                    <div className="w-16 h-5 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                  </div>
                  <div className="flex gap-3 items-center">
                    <div className="w-14 h-14 bg-slate-200 dark:bg-slate-800 rounded-xl shrink-0"></div>
                    <div className="flex-1 space-y-2">
                      <div className="w-full h-4 bg-slate-200 dark:bg-slate-800 rounded"></div>
                      <div className="w-1/2 h-3 bg-slate-200 dark:bg-slate-800 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {type === 'general' && (
          <div className="space-y-4 animate-pulse">
            <div className="flex justify-between items-center">
              <div className="w-28 h-7 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
              <div className="w-9 h-9 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
            </div>
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex gap-3 items-center">
                  <div className="w-14 h-14 bg-slate-200 dark:bg-slate-800 rounded-xl shrink-0"></div>
                  <div className="flex-1 space-y-2">
                    <div className="w-full h-4 bg-slate-200 dark:bg-slate-800 rounded"></div>
                    <div className="w-2/3 h-3 bg-slate-200 dark:bg-slate-800 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
