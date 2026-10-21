import React, { useState, useEffect, useRef } from 'react';
import { GripVertical, ArrowLeftRight } from 'lucide-react';

export default function DevPortalSwitcher({ currentPortal }: { currentPortal: 'user' | 'admin' }) {
  // Hide in production build on Netlify or public production deployments
  const isNetlify = (typeof __IS_NETLIFY__ !== 'undefined' && Boolean(__IS_NETLIFY__)) || (
    typeof window !== 'undefined' && (
      window.location.hostname.includes('netlify.app') ||
      window.location.hostname.includes('netlify') ||
      window.location.hostname.includes('walmark-retailshop.com') ||
      Boolean((window as any).__NETLIFY__) ||
      Boolean(import.meta.env.VITE_NETLIFY)
    )
  );

  const isProduction = import.meta.env.PROD || !import.meta.env.DEV;
  const isAisDev = typeof window !== 'undefined' && (
    window.location.hostname.includes('ais-dev') ||
    window.location.hostname.includes('ais-pre') ||
    window.location.hostname.includes('europe-west2.run.app') ||
    window.location.hostname.includes('run.app')
  );
  const isLocalhost = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.startsWith('192.168.') ||
    window.location.hostname.startsWith('10.')
  );

  // If on Netlify, or in a production build that is not our AI Studio dev / localhost environment, hide completely
  if (isNetlify || (isProduction && !isAisDev && !isLocalhost)) {
    return null;
  }

  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    try {
      const saved = sessionStorage.getItem('cb_portal_switcher_pos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          return parsed;
        }
      }
    } catch {}
    // Default top-right position
    return {
      x: typeof window !== 'undefined' ? Math.max(16, window.innerWidth - 180) : 100,
      y: 16
    };
  });

  const [isDragging, setIsDragging] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    lastX: number;
    lastY: number;
    hasMoved: boolean;
  }>({ startX: 0, startY: 0, initialX: 0, initialY: 0, lastX: 0, lastY: 0, hasMoved: false });

  const containerRef = useRef<HTMLDivElement>(null);

  const targetPortalName = currentPortal === 'user' ? 'Admin Portal' : 'User Portal';

  // Handle window resizing to keep button on screen
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => {
        const maxX = window.innerWidth - (containerRef.current?.offsetWidth || 160) - 10;
        const maxY = window.innerHeight - (containerRef.current?.offsetHeight || 44) - 10;
        return {
          x: Math.min(Math.max(10, prev.x), Math.max(10, maxX)),
          y: Math.min(Math.max(10, prev.y), Math.max(10, maxY))
        };
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    // Only drag with primary mouse button or touch
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y,
      lastX: position.x,
      lastY: position.y,
      hasMoved: false
    };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - dragRef.current.startX;
      const deltaY = moveEvent.clientY - dragRef.current.startY;

      if (!dragRef.current.hasMoved && (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4)) {
        dragRef.current.hasMoved = true;
        setIsDragging(true);
      }

      if (dragRef.current.hasMoved) {
        const elWidth = containerRef.current?.offsetWidth || 160;
        const elHeight = containerRef.current?.offsetHeight || 44;
        const newX = Math.min(Math.max(8, dragRef.current.initialX + deltaX), window.innerWidth - elWidth - 8);
        const newY = Math.min(Math.max(8, dragRef.current.initialY + deltaY), window.innerHeight - elHeight - 8);

        dragRef.current.lastX = newX;
        dragRef.current.lastY = newY;
        setPosition({ x: newX, y: newY });
      }
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);

      if (dragRef.current.hasMoved) {
        try {
          sessionStorage.setItem('cb_portal_switcher_pos', JSON.stringify({
            x: dragRef.current.lastX,
            y: dragRef.current.lastY
          }));
        } catch {}
        setTimeout(() => setIsDragging(false), 50);
      } else {
        setIsDragging(false);
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
  };

  const handleToggleClick = (e: React.MouseEvent) => {
    if (dragRef.current.hasMoved || isDragging) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    setExpanded(!expanded);
  };

  const handleSwitchClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragRef.current.hasMoved || isDragging) {
      return;
    }
    const targetUrl = currentPortal === 'user' 
      ? window.location.origin + '/admin.html' 
      : window.location.origin + '/#/';
    window.location.href = targetUrl;
  };

  return (
    <div
      ref={containerRef}
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        touchAction: 'none'
      }}
      className={`fixed top-0 left-0 z-[999999] select-none transition-shadow ${
        isDragging ? 'cursor-grabbing opacity-90 scale-105' : 'cursor-grab'
      }`}
      onPointerDown={handlePointerDown}
    >
      <div className="flex items-center gap-1.5 bg-slate-900/95 dark:bg-slate-950/95 text-white backdrop-blur-md px-2.5 py-1.5 rounded-full shadow-2xl border border-slate-700/80 hover:border-slate-500 transition-all duration-150">
        <div 
          className="text-slate-400 hover:text-slate-200 cursor-grab active:cursor-grabbing p-0.5" 
          title="Drag to reposition floating portal switcher"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </div>

        <button
          type="button"
          onClick={handleToggleClick}
          className="flex items-center gap-1.5 text-xs font-bold tracking-wide focus:outline-none cursor-pointer"
          title="Dev Environment Portal Switcher (Drag to float anywhere)"
        >
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
          <span className="bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded text-[10px] uppercase font-mono font-bold">DEV</span>
          <span className="text-[11px] text-slate-200 font-semibold">{currentPortal === 'user' ? 'User' : 'Admin'}</span>
        </button>

        {expanded && (
          <button
            type="button"
            onClick={handleSwitchClick}
            className="ml-1 flex items-center gap-1 text-[11px] font-bold bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1 rounded-full transition-all shadow-xs active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <ArrowLeftRight className="w-3 h-3" />
            <span>Switch to {targetPortalName}</span>
          </button>
        )}
      </div>
    </div>
  );
}
