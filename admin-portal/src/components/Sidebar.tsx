import React, { useState } from 'react';
import { 
  LayoutGrid, 
  ShieldCheck, 
  Users, 
  UserCog, 
  User, 
  Briefcase, 
  TrendingUp, 
  DollarSign, 
  MessageSquare, 
  Settings,
  Layers,
  ChevronLeft,
  ChevronRight,
  X,
  LucideIcon
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  session: AdminSession;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface AdminSession {
  role: string;
  name?: string;
  email?: string;
  accountId?: string;
  permissions?: {
    userManagement?: boolean;
    ordersInProgress?: boolean;
    orderTasking?: boolean;
    financialCenter?: boolean;
    supportChat?: boolean;
  };
}

interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  roles: string[];
}

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  session,
  isCollapsed: controlledCollapsed,
  onToggleCollapse,
  isMobileOpen, 
  onCloseMobile 
}: SidebarProps) {
  const [internalCollapsed, setInternalCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('cb_admin_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

  const toggleCollapse = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      const next = !internalCollapsed;
      setInternalCollapsed(next);
      try {
        localStorage.setItem('cb_admin_sidebar_collapsed', next ? 'true' : 'false');
      } catch (e) {}
    }
  };

  // Exact 11 items from screenshot in exact order
  const allMenuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Overview', icon: LayoutGrid, roles: ['Owner', 'Admin', 'Staff'] },
    { id: 'ownership', label: 'Ownership', icon: ShieldCheck, roles: ['Owner'] },
    { id: 'sla-admins', label: 'Administrators', icon: UserCog, roles: ['Owner', 'Admin'] },
    { id: 'sla-staff', label: 'Staff Members', icon: Users, roles: ['Owner', 'Admin', 'Staff'] },
    { id: 'user-management', label: 'User Management', icon: User, roles: ['Owner', 'Admin', 'Staff'] },
    { id: 'orders-tasking', label: 'Orders Tasking', icon: Briefcase, roles: ['Owner', 'Admin', 'Staff'] },
    { id: 'templates-summary', label: 'Templates Matrix', icon: Layers, roles: ['Owner', 'Admin', 'Staff'] },
    { id: 'orders-in-progress', label: 'Orders In Progress', icon: TrendingUp, roles: ['Owner', 'Admin', 'Staff'] },
    { id: 'financial-center', label: 'Financial Center', icon: DollarSign, roles: ['Owner', 'Admin', 'Staff'] },
    { id: 'support-chat', label: 'Support & Chat', icon: MessageSquare, roles: ['Owner', 'Admin', 'Staff'] },
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['Owner', 'Admin'] }
  ];

  const activeRole = session.role;
  const menuItems = allMenuItems.filter(item => {
    if (!item.roles.includes(activeRole)) return false;
    
    if (activeRole === 'Staff') {
      const perms = session.permissions || {
        userManagement: true,
        ordersInProgress: true,
        orderTasking: false,
        financialCenter: false,
        supportChat: false
      };
      
      if (item.id === 'user-management' && !perms.userManagement) return false;
      if (item.id === 'orders-tasking' && !perms.orderTasking) return false;
      if (item.id === 'templates-summary' && !perms.orderTasking) return false;
      if (item.id === 'orders-in-progress' && !perms.ordersInProgress) return false;
      if (item.id === 'financial-center' && !perms.financialCenter) return false;
      if (item.id === 'support-chat' && !perms.supportChat) return false;
    }
    
    return true;
  });

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs md:hidden transition-opacity cursor-pointer"
          aria-hidden="true"
        />
      )}

      {/* Side Navigation Bar */}
      <aside 
        className={`bg-white dark:bg-slate-900 border-r border-slate-200 flex flex-col transition-all duration-200 ease-in-out shrink-0 z-50 h-dvh select-none ${
          'hidden md:flex'
        } ${
          isCollapsed ? 'md:w-16 md:flex-[0_0_4rem]' : 'md:w-64 md:flex-[0_0_16rem]'
        } ${
          isMobileOpen ? '!flex fixed inset-y-0 left-0 w-64 shadow-2xl animate-in slide-in-from-left duration-200' : ''
        }`}
      >
        {/* Header & Logo Bar - Exactly 64px (h-16) to align with top Navbar */}
        <div className="h-16 px-4 sm:px-5 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 shrink-0">
          {(!isCollapsed || isMobileOpen) ? (
            <div className="flex items-center gap-2 overflow-hidden">
              <img 
                src="/WALMARK.png" 
                alt="Walmark" 
                className="h-8.5 w-auto max-w-[155px] object-contain rounded"
              />
            </div>
          ) : (
            <button 
              className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto select-none cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Expand Sidebar"
              onClick={toggleCollapse}
            >
              <img 
                src="/walmark_icon_192x192.png" 
                alt="Walmark" 
                className="w-8 h-8 rounded-lg object-contain shadow-xs" 
              />
            </button>
          )}

          {/* Desktop Collapse Toggle */}
          {(!isCollapsed || isMobileOpen) && (
            <button
              onClick={toggleCollapse}
              title="Collapse Sidebar"
              className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer shrink-0"
            >
              <ChevronLeft size={18} />
            </button>
          )}

          {/* Mobile Close Button */}
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Items List */}
        <nav className="flex-1 min-w-0 overflow-y-auto p-6 space-y-6 no-scrollbar">
          {menuItems.map(item => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            const showText = !isCollapsed || isMobileOpen;

            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                title={item.label}
                className={`min-w-0 flex flex-nowrap items-center rounded-xl transition-all cursor-pointer ${
                  !showText 
                    ? 'justify-center w-10 h-10 mx-auto p-0' 
                    : 'w-full min-h-10 gap-3 px-3 py-2.5 text-left text-[13.5px]'
                } ${
                  isActive 
                    ? 'bg-[#0071ce] text-white shadow-xs font-semibold' 
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60 font-medium'
                }`}
              >
                <IconComponent 
                  size={19} 
                  strokeWidth={isActive ? 2.2 : 1.8} 
                  className={`shrink-0 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} 
                />
                {showText && (
                  <span className="block min-w-0 flex-1 truncate whitespace-nowrap">
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer User Card */}
        <div className="p-3 border-t border-slate-200/80 dark:border-slate-800 shrink-0">
          {(!isCollapsed || isMobileOpen) ? (
            <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#0071ce] flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-2xs">
                {session.role[0] || 'O'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate leading-tight">
                  {session.role === 'Staff' ? (session.name || 'Staff User') : 'System Owner'}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium capitalize">
                    {session.role}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center py-1">
              <div 
                className="w-8 h-8 rounded-lg bg-[#0071ce] flex items-center justify-center text-white text-xs font-bold shadow-xs cursor-default" 
                title={`${session.role === 'Staff' ? (session.name || 'Staff') : 'System Owner'} (${session.role})`}
              >
                {session.role[0] || 'O'}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
