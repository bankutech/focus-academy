import { usePageMeta } from '../../hooks/usePageMeta';
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
  Settings as SettingsIcon,
  Keyboard,
  UserPlus,
  Lock
} from 'lucide-react';
import { logOutAdmin } from '../../services/firebase';
import { getVerifiedAdmin, setVerifiedAdmin } from '../../services/adminIdentity';
import { AdminDataService } from '../../services/adminDataService';
import AdminProfileMenu from '../../components/admin/AdminProfileMenu';
import AdminTerminalLock from '../../components/admin/AdminTerminalLock';
import { useFocusTrap } from '../../hooks/useFocusTrap';

export default function AdminLayout() {
  usePageMeta({
    title: 'Admin Portal | Focus Academy',
    path: '/admin-portal',
    robots: 'noindex,nofollow',
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const verified = getVerifiedAdmin();
  const userEmail = verified?.email || '';
  const displayName = verified?.displayName || 'Administrator';

  const handleLogout = async () => {
    try {
      await logOutAdmin();
    } catch {
      setVerifiedAdmin(null);
    }
    localStorage.removeItem('focus_demo_admin');
    setVerifiedAdmin(null);
    navigate('/admin-portal/login', { replace: true });
  };

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
        if (e.key === 'Escape') {
          e.target.blur();
        }
        return;
      }
      if (e.altKey && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        navigate('/admin-portal/ledger');
      } else if (e.altKey && (e.key === 'l' || e.key === 'L')) {
        e.preventDefault();
        navigate('/admin-portal/leads');
      } else if (e.altKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        navigate('/admin-portal/students');
      } else if (e.altKey && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        navigate('/admin-portal/batches');
      } else if (e.altKey && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault();
        navigate('/admin-portal/reports');
      } else if (e.key === '?') {
        e.preventDefault();
        setShortcutsModalOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate]);
  const navItems = [
    { name: 'Dashboard', path: '/admin-portal', icon: LayoutDashboard, end: true, permission: 'canRecordPayments' },
    { name: 'Inquiries & Leads', path: '/admin-portal/leads', icon: UserPlus, permission: 'canManageStudents' },
    { name: 'Batches', path: '/admin-portal/batches', icon: Layers },
    { name: 'Students', path: '/admin-portal/students', icon: Users },
    { name: 'Fee Schedules', path: '/admin-portal/fees', icon: CreditCard, permission: 'canWaiveFees' },
    { name: 'Ledger & Payments', path: '/admin-portal/ledger', icon: Receipt, permission: 'canRecordPayments' },
    { name: 'WhatsApp Reminders', path: '/admin-portal/reminders', icon: MessageSquare, permission: 'canTriggerReminders' },
    { name: 'Reports & Analytics', path: '/admin-portal/reports', icon: BarChart3, permission: 'canRecordPayments' },
    { name: 'Events', path: '/admin-portal/events', icon: ShieldAlert, permission: 'canManageSettings' },
    { name: 'Academy Settings', path: '/admin-portal/settings', icon: SettingsIcon, permission: 'canManageSettings' }
  ];
  const visibleNavItems = navItems.filter(
    (item) => !item.permission || AdminDataService.hasPermission(userEmail, item.permission)
  );

  const shortcutsModalRef = React.useRef(null);
  useFocusTrap(shortcutsModalRef, shortcutsModalOpen);

  return (
    <div className="admin-portal-root min-h-screen bg-[#F1F5F9] flex flex-col font-sans-body w-full max-w-full">
      <AdminTerminalLock 
        userEmail={userEmail} 
        displayName={displayName} 
        onLogout={handleLogout} 
      />
      <header className="bg-[#0F172A] text-white border-b border-[#1E293B] sticky top-0 z-40 shadow-xs w-full max-w-full">
        <div className="w-full px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 max-w-full">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 sm:p-2 rounded-none text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer shrink-0"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <a href="/admin-portal" className="flex items-center space-x-2 sm:space-x-3 cursor-pointer min-w-0">
              <img
                src="/logo-80.png"
                alt="Focus Academy"
                width="80"
                height="80"
                className="w-8 h-8 sm:w-9 sm:h-9 object-contain rounded-none bg-white p-0.5 shrink-0"
              />
              <div className="flex flex-col text-left min-w-0">
                <div className="flex items-center space-x-1.5 sm:space-x-2">
                  <span className="font-extrabold text-xs sm:text-base tracking-tight text-white leading-none truncate">
                    Focus Academy
                  </span>
                  <span className="hidden min-[420px]:inline-block text-[10px] uppercase font-bold tracking-wider px-1.5 sm:px-2 py-0.5 rounded-none bg-orange-500/20 text-orange-300 border border-orange-500/30 shrink-0">
                    Admin Portal
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 leading-none mt-1 hidden sm:inline truncate">
                  Thiripura Complex Campus Management
                </span>
              </div>
            </a>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            <button
              type="button"
              onClick={() => window.__lockAdminTerminal && window.__lockAdminTerminal()}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
              title="Lock Terminal Screen (Shared Reception Desk Security)"
              aria-label="Lock Campus Terminal"
            >
              <Lock className="w-3.5 h-3.5 text-brand" />
              <span className="hidden sm:inline">Lock Screen</span>
            </button>
            <AdminProfileMenu />
          </div>
        </div>
      </header>

      <div className="flex-1 flex min-h-[calc(100vh-4rem)]">
        <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 fixed top-16 left-0 bottom-0 z-30 justify-between select-none overflow-y-auto">
          <div className="p-4 space-y-3 overflow-y-auto flex-1 min-h-0">
            <div>
              <div className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 px-3 pb-2">
                Campus Navigation
              </div>
              <nav className="space-y-1">
                {visibleNavItems.map((item) => {
                  const Icon = item.icon;
                  const active = item.end 
                    ? location.pathname === item.path 
                    : (item.path === '/admin-portal/events'
                        ? location.pathname.startsWith('/admin-portal/events') || location.pathname.startsWith('/admin-portal/audit-logs')
                        : location.pathname.startsWith(item.path));

                  return (
                    <NavLink
                      key={item.name}
                      to={item.path}
                      end={item.end}
                      className={`flex items-center space-x-3 px-3 py-2.5 rounded-none text-xs font-bold transition-all cursor-pointer ${
                        active
                          ? 'bg-[#0F172A] text-white shadow-xs'
                          : 'text-slate-600 hover:text-[#0F172A] hover:bg-slate-100'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${active ? 'text-brand' : 'text-slate-400'}`} />
                      <span>{item.name}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          </div>

          <div className="p-4 border-t border-slate-200 bg-slate-50/70 text-[11px] text-slate-500 space-y-1.5 shrink-0">
            <div className="flex items-center space-x-1.5 font-bold text-[#0F172A]">
              <span className="w-2 h-2 rounded-full admin-keep-circle bg-emerald-500 inline-block" />
              <span>Focus Academy</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-snug">
              Thiripura Complex, Thoramangalam, Perambalur — 621220
            </p>
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
                    <img src="/logo-80.png" alt="Focus Academy logo" width="80" height="80" className="w-8 h-8 object-contain" />
                    <span className="font-extrabold text-sm text-[#0F172A]">Focus Admin</span>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1 rounded-none text-slate-500 hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="mt-4 p-2.5 bg-slate-50 rounded-none text-xs border border-slate-200 mb-4">
                  <p className="font-bold text-[#0F172A] truncate">{displayName}</p>
                  <p className="text-[11px] text-slate-500 truncate">{userEmail}</p>
                </div>

                <nav className="space-y-1">
                  {visibleNavItems.map((item) => {
                    const Icon = item.icon;
                    const active = item.end 
                      ? location.pathname === item.path 
                      : (item.path === '/admin-portal/events'
                          ? location.pathname.startsWith('/admin-portal/events') || location.pathname.startsWith('/admin-portal/audit-logs')
                          : location.pathname.startsWith(item.path));

                    return (
                      <NavLink
                        key={item.name}
                        to={item.path}
                        end={item.end}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center space-x-3 px-3 py-2.5 rounded-none text-xs font-bold transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#0F172A] text-white shadow-xs'
                            : 'text-slate-600 hover:text-[#0F172A] hover:bg-slate-100'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${active ? 'text-brand' : 'text-slate-400'}`} />
                        <span>{item.name}</span>
                      </NavLink>
                    );
                  })}
                </nav>
              </div>

              <div className="pt-4 border-t border-slate-200 space-y-3">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-none text-xs font-bold cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 min-w-0 lg:pl-64 bg-[#F8FAFC] p-3 sm:p-6 lg:p-8 max-w-full overflow-x-clip">
          <div className="max-w-screen-2xl mx-auto space-y-6 min-w-0 max-w-full">
            <Outlet />
          </div>
        </main>
      </div>
      {shortcutsModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/70 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="shortcuts-modal-title"
        >
          <div 
            ref={shortcutsModalRef}
            className="bg-white rounded-none shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in duration-200 text-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center space-x-2 text-slate-900">
                <Keyboard className="w-5 h-5 text-orange-600" />
                <h3 id="shortcuts-modal-title" className="font-extrabold text-sm uppercase">Front-Desk Keyboard Shortcuts</h3>
              </div>
              <button onClick={() => setShortcutsModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between items-center p-2 rounded-none bg-slate-50 border border-slate-100">
                <span className="text-slate-700 font-medium">Record Payment / Ledger</span>
                <kbd className="px-2 py-1 bg-white border border-slate-300 rounded-none font-mono font-bold text-slate-800 shadow-2xs">Alt + P</kbd>
              </div>
              <div className="flex justify-between items-center p-2 rounded-none bg-slate-50 border border-slate-100">
                <span className="text-slate-700 font-medium">Students Directory</span>
                <kbd className="px-2 py-1 bg-white border border-slate-300 rounded-none font-mono font-bold text-slate-800 shadow-2xs">Alt + S</kbd>
              </div>
              <div className="flex justify-between items-center p-2 rounded-none bg-slate-50 border border-slate-100">
                <span className="text-slate-700 font-medium">Batches &amp; Timings</span>
                <kbd className="px-2 py-1 bg-white border border-slate-300 rounded-none font-mono font-bold text-slate-800 shadow-2xs">Alt + B</kbd>
              </div>
              <div className="flex justify-between items-center p-2 rounded-none bg-slate-50 border border-slate-100">
                <span className="text-slate-700 font-medium">Reports &amp; Cash Till</span>
                <kbd className="px-2 py-1 bg-white border border-slate-300 rounded-none font-mono font-bold text-slate-800 shadow-2xs">Alt + R</kbd>
              </div>
              <div className="flex justify-between items-center p-2 rounded-none bg-slate-50 border border-slate-100">
                <span className="text-slate-700 font-medium">Close Modal / Blur Input</span>
                <kbd className="px-2 py-1 bg-white border border-slate-300 rounded-none font-mono font-bold text-slate-800 shadow-2xs">Esc</kbd>
              </div>
              <div className="flex justify-between items-center p-2 rounded-none bg-slate-50 border border-slate-100">
                <span className="text-slate-700 font-medium">Toggle Shortcuts Cheatsheet</span>
                <kbd className="px-2 py-1 bg-white border border-slate-300 rounded-none font-mono font-bold text-slate-800 shadow-2xs">?</kbd>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShortcutsModalOpen(false)}
                className="px-4 py-2 bg-[#0F172A] hover:bg-slate-800 text-white font-bold rounded-none cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
