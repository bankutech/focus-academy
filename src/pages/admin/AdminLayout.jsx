import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Layers, 
  Receipt, 
  CreditCard, 
  MessageSquare, 
  BarChart3, 
  ShieldAlert, 
  LogOut, 
  Menu, 
  X,
  ExternalLink,
  Database
} from 'lucide-react';
import { logOutAdmin, isFirebaseConfigured } from '../../services/firebase';

export default function AdminLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const hasFirebase = isFirebaseConfigured();

  const sessionRaw = sessionStorage.getItem('focus_academy_admin_session');
  let userEmail = 'admin@focusacademyperambalur.com';
  let displayName = 'Administrator';
  if (sessionRaw) {
    try {
      const parsed = JSON.parse(sessionRaw);
      if (parsed.email) userEmail = parsed.email;
      if (parsed.displayName) displayName = parsed.displayName;
    } catch {
      // fallback
    }
  }

  const handleLogout = async () => {
    try {
      await logOutAdmin();
    } catch {
      // ignore
    }
    sessionStorage.removeItem('focus_academy_admin_session');
    navigate('/admin-portal/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin-portal', icon: LayoutDashboard, end: true },
    { name: 'Batches', path: '/admin-portal/batches', icon: Layers },
    { name: 'Students', path: '/admin-portal/students', icon: Users },
    { name: 'Fee Schedules', path: '/admin-portal/fees', icon: CreditCard },
    { name: 'Ledger & Payments', path: '/admin-portal/ledger', icon: Receipt },
    { name: 'WhatsApp Reminders', path: '/admin-portal/reminders', icon: MessageSquare },
    { name: 'Reports & Analytics', path: '/admin-portal/reports', icon: BarChart3 },
    { name: 'Audit Logs', path: '/admin-portal/audit-logs', icon: ShieldAlert }
  ];

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col font-sans-body">
      <header className="bg-[#0F172A] text-white border-b border-[#1E293B] sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <a href="/admin-portal" className="flex items-center space-x-3 cursor-pointer">
              <img 
                src="/logo.png" 
                alt="Focus Academy" 
                className="w-9 h-9 object-contain rounded-md bg-white p-0.5" 
              />
              <div className="flex flex-col text-left">
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-sm sm:text-base tracking-tight text-white leading-none">
                    Focus Academy
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
                    Admin Portal
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 leading-none mt-1 hidden sm:inline">
                  Thiripura Complex Campus Management
                </span>
              </div>
            </a>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-300">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>{hasFirebase ? 'Cloud Firestore Live' : 'Verified Local Sync'}</span>
            </div>

            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-white leading-tight truncate max-w-[180px]">
                {displayName}
              </span>
              <span className="text-[10px] text-slate-400 leading-none truncate max-w-[180px]">
                {userEmail}
              </span>
            </div>

            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md text-xs font-semibold border border-slate-700 transition-colors"
            >
              <span>View Public Site</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-red-600/90 hover:bg-red-600 text-white rounded-md text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex gap-6">
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-3 sticky top-22">
            <div className="text-[11px] uppercase tracking-wider font-extrabold text-slate-400 px-3 py-2">
              Institute Administration
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = item.end 
                  ? location.pathname === item.path 
                  : location.pathname.startsWith(item.path);

                return (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    end={item.end}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#0F172A] text-white shadow-xs'
                        : 'text-slate-600 hover:text-[#0F172A] hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-[#EA580C]' : 'text-slate-400'}`} />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </nav>

            <div className="mt-6 pt-4 border-t border-slate-100 px-3 text-[11px] text-slate-500 space-y-1">
              <p className="font-semibold text-slate-700">Focus Academy</p>
              <p>Perambalur Campus Desk</p>
              <p className="text-[10px] text-slate-400">Security Version 2026.1</p>
            </div>
          </div>
        </aside>

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div 
              className="fixed inset-0 bg-[#0F172A]/70 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative w-72 max-w-xs bg-white h-full shadow-2xl p-5 flex flex-col justify-between z-10 animate-in slide-in-from-left duration-200">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <div className="flex items-center space-x-2">
                    <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
                    <span className="font-extrabold text-sm text-[#0F172A]">Focus Admin</span>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1 rounded text-slate-500 hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="mt-4 p-2.5 bg-slate-50 rounded-lg text-xs border border-slate-200 mb-4">
                  <p className="font-bold text-[#0F172A] truncate">{displayName}</p>
                  <p className="text-[11px] text-slate-500 truncate">{userEmail}</p>
                </div>

                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = item.end 
                      ? location.pathname === item.path 
                      : location.pathname.startsWith(item.path);

                    return (
                      <NavLink
                        key={item.name}
                        to={item.path}
                        end={item.end}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#0F172A] text-white shadow-xs'
                            : 'text-slate-600 hover:text-[#0F172A] hover:bg-slate-100'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${active ? 'text-[#EA580C]' : 'text-slate-400'}`} />
                        <span>{item.name}</span>
                      </NavLink>
                    );
                  })}
                </nav>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
