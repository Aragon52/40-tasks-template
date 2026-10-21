import React from 'react';

/**
 * Shared UI Primitives for both User and Admin Portals
 * Built with Tailwind CSS for consistent design language.
 */

// --- Button ---
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  loading?: boolean; // alias for isLoading
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  isLoading, 
  loading,
  icon,
  className = '', 
  ...props 
}) => {
  const isActuallyLoading = isLoading || loading;
  const baseStyles = "inline-flex items-center gap-2 justify-center rounded-xl font-bold transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer overflow-hidden relative";
  
  const variants = {
    primary: "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/20 hover:from-blue-500 hover:to-blue-600",
    secondary: "bg-amber-400 text-slate-900 shadow-lg shadow-amber-500/10 hover:bg-amber-300",
    outline: "border-2 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900",
    ghost: "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900",
    danger: "bg-rose-600 text-white shadow-lg shadow-rose-500/20 hover:bg-rose-500",
    success: "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-500",
    warning: "bg-amber-500 text-white shadow-lg shadow-amber-500/20 hover:bg-amber-400",
    info: "bg-sky-600 text-white shadow-lg shadow-sky-500/20 hover:bg-sky-500"
  };

  const sizes = {
    sm: "h-9 px-4 text-xs",
    md: "h-11 px-6 text-sm",
    lg: "h-14 px-8 text-base",
    xl: "h-16 px-10 text-lg"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant as keyof typeof variants] || variants.primary} ${sizes[size as keyof typeof sizes] || sizes.md} ${className}`} 
      disabled={isActuallyLoading || props.disabled}
      {...props}
    >
      {isActuallyLoading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
};

// --- Card ---
export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => {
  const hasExplicitPadding = className.includes('p-') || className.includes('px-') || className.includes('py-');
  const basePadding = hasExplicitPadding ? '' : 'p-6';
  return (
    <div 
      className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs overflow-hidden ${basePadding} ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
};

// --- Badge ---
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'outline' | 'primary';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral', className = '' }) => {
  const variants = {
    success: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50",
    warning: "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/50",
    error: "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/50",
    info: "bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 border-sky-100 dark:border-sky-900/50",
    neutral: "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-slate-700",
    outline: "bg-transparent text-slate-500 border-slate-200 dark:border-slate-800",
    primary: "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/50"
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${variants[variant as keyof typeof variants] || variants.neutral} ${className}`}>
      {children}
    </span>
  );
};

// --- Input ---
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, icon, helperText, className = '', ...props }) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</label>}
      <div className="relative group">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none">
            {icon}
          </div>
        )}
        <input 
          className={`h-12 w-full ${icon ? 'pl-11' : 'px-4'} pr-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm outline-none ${error ? 'border-rose-500' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <span className="text-[10px] font-bold text-rose-500 uppercase">{error}</span>}
      {!error && helperText && <span className="text-[10px] font-medium text-slate-400 leading-tight">{helperText}</span>}
    </div>
  );
};

// --- Modal ---
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizes = {
    md: "max-w-lg",
    lg: "max-w-3xl",
    xl: "max-w-5xl"
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 overflow-hidden">
      <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${sizes[size]} max-h-[92dvh] flex flex-col bg-white dark:bg-slate-950 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 fade-in duration-200 my-auto`}>
        {title && (
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-950 sticky top-0 z-10">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">{title}</h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-full transition-colors cursor-pointer text-slate-500">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}
        <div className="p-6 overflow-y-auto flex-1 min-h-0">{children}</div>
      </div>
    </div>
  );
};
