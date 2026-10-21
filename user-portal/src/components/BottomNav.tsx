import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { 
  Home as HomeIcon, 
  ClipboardList, 
  ShoppingBag, 
  MessageCircle, 
  UserCircle 
} from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  isCenter?: boolean;
}

export default function BottomNav() {
  const location = useLocation();

  // Robust path detection for HashRouter
  const currentPath = location.pathname;
  
  const navItems: NavItem[] = [
    { label: 'Home', path: '/home' },
    { label: 'Orders', path: '/orders' },
    { label: 'Picking', path: '/match', isCenter: true },
    { label: 'Support', path: '/support' },
    { label: 'Profile', path: '/profile' }
  ];

  const renderIcon = (label: string, active: boolean) => {
    switch(label) {
      case 'Home':
        return <HomeIcon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />;
      case 'Orders':
        return <ClipboardList className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />;
      case 'Picking':
        return <ShoppingBag className="w-5 h-5" strokeWidth={2.4} />;
      case 'Support':
        return <MessageCircle className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />;
      case 'Profile':
        return <UserCircle className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />;
      default:
        return null;
    }
  };

  return (
    <nav className="fixed bottom-0 inset-x-0 mx-auto w-full max-w-md h-14 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800/80 px-3 z-50 flex items-center justify-between shadow-lg">
      {navItems.map((item, index) => {
        const active = currentPath.startsWith(item.path);

        if (item.isCenter) {
          return (
            <Link 
              key={index}
              to={item.path}
              aria-label={item.label}
              title={item.label}
              className="flex items-center justify-center flex-1 h-full py-1 group cursor-pointer"
            >
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 shadow-md ${
                  active 
                    ? 'bg-blue-600 text-white shadow-blue-500/30 ring-2 ring-blue-400/50 scale-105' 
                    : 'bg-gradient-to-tr from-blue-600 to-sky-500 text-white shadow-blue-500/20 hover:scale-105'
                }`}
              >
                {renderIcon(item.label, active)}
              </div>
            </Link>
          );
        }

        return (
          <Link
            key={index}
            to={item.path}
            aria-label={item.label}
            title={item.label}
            className="flex flex-col items-center justify-center flex-1 h-full py-1 transition-all cursor-pointer group"
          >
            <div className={`p-1.5 rounded-xl transition-all duration-200 ${
              active 
                ? 'text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-950/60 scale-105' 
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40'
            }`}>
              {renderIcon(item.label, active)}
            </div>
            {active && (
              <span className="w-1 h-1 rounded-full bg-blue-600 dark:bg-blue-400 mt-0.5 animate-in fade-in zoom-in-75 duration-200" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
