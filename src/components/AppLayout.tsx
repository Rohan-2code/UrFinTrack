import { useState, useRef, useEffect, type ReactNode } from 'react';
import { Wallet, LayoutDashboard, Receipt, FileBarChart, Tags, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export type TabId = 'dashboard' | 'transactions' | 'report' | 'categories';

interface Props {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  children: ReactNode;
}

const NAV: { id: TabId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions', icon: Receipt },
  { id: 'report', label: 'Monthly Report', icon: FileBarChart },
  { id: 'categories', label: 'Categories', icon: Tags },
];

export function AppLayout({ activeTab, onTabChange, children }: Props) {
  const { user, signOut, isLocalMode } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initials = (user?.email ?? '?')
    .split('@')[0]
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Top nav */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight hidden sm:block">FinTrack</span>
            </div>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                    activeTab === item.id
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Profile */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-slate-800/50 transition"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold">
                  {initials}
                </div>
                <span className="text-sm text-slate-300 hidden sm:block max-w-[140px] truncate">
                  {user?.email}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-500" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 rounded-xl bg-slate-800 border border-slate-700 shadow-2xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-700">
                    <p className="text-sm font-medium text-white truncate">{user?.email}</p>
                    {isLocalMode && (
                      <p className="text-xs text-amber-400 mt-1">Local mode — data stored in browser</p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      signOut();
                    }}
                    className="flex items-center gap-2 w-full px-4 py-3 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white transition"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile nav */}
          <nav className="md:hidden flex items-center gap-1 pb-2 overflow-x-auto">
            {NAV.map((item) => (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                  activeTab === item.id
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">{children}</main>
    </div>
  );
}
