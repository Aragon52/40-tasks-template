import React, { Component, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { initAdminPWAUpdatePrompt } from './utils/updatePrompt.ts';

document.title = 'Order Picking Platform - Admin Portal';

// Register service worker
initAdminPWAUpdatePrompt();

class AdminErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Admin Portal Error:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="bg-slate-800 border border-slate-700 p-8 rounded-2xl max-w-md w-full shadow-2xl space-y-4">
            <h2 className="text-xl font-bold text-red-400">Admin Portal Recovered</h2>
            <p className="text-xs text-slate-300">An unexpected rendering issue occurred. You can reload the admin session or return to the User Portal.</p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  localStorage.removeItem('cb_admin_session');
                  window.location.reload();
                }}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Reload Admin
              </button>
              <button
                onClick={() => {
                  window.location.href = window.location.origin + '/#/';
                }}
                className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                User Portal
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <AdminErrorBoundary>
        <App />
      </AdminErrorBoundary>
    </StrictMode>
  );
}
