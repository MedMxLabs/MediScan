import { Suspense, useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { logoutApi } from '../auth';
import { setToken } from '../api/client';
import {
  LayoutDashboard,
  Search,
  Upload,
  History,
  Bell,
  TrendingUp,
  FileText,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  MapPin,
  User as UserIcon,
} from 'lucide-react';
import Logo from '../components/Logo';
import LoadingState from '../components/dashboard/LoadingState';
import BackedByMicrosoft from '../components/BackedByMicrosoft';
import useAppThemeDark from '../hooks/useAppThemeDark';

const NAV_PRIMARY = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Search Medicine', href: '/dashboard/search', icon: Search },
  { name: 'Upload Prescription', href: '/dashboard/upload', icon: Upload },
  { name: 'Medicine History', href: '/dashboard/history', icon: History },
  { name: 'Reminders', href: '/dashboard/reminders', icon: Bell },
  { name: 'Adherence', href: '/dashboard/adherence', icon: TrendingUp },
  { name: 'Lab Reports', href: '/dashboard/reports', icon: FileText },
  { name: 'Nearby Pharmacies', href: '/dashboard/pharmacies', icon: MapPin },
  { name: 'Jan Aushadhi', href: '/dashboard/jan-aushadhi', icon: MapPin },
  { name: 'Help Assistant', href: '/dashboard/assistant', icon: MessageSquare },
];

const NAV_SECONDARY = [{ name: 'Profile & Settings', href: '/dashboard/profile', icon: Settings }];

const navClass = ({ isActive }) =>
  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
    isActive
      ? 'bg-brand-gradient text-white shadow-brand'
      : 'text-slate-200/90 hover:bg-white/10 hover:text-white'
  }`;

function DashboardSidebar({ mobile = false, onNavigate, onLogout }) {
  return (
    <div className="flex flex-col h-full">
      <div className="h-16 flex items-center px-5 border-b border-white/10 shrink-0">
        <Logo to="/dashboard" size="sm" theme="on-dark" />
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {NAV_PRIMARY.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.href === '/dashboard'}
            className={navClass}
            onClick={() => mobile && onNavigate?.()}
          >
            <item.icon size={18} className="shrink-0" />
            <span className="truncate">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-white/10 space-y-0.5 shrink-0">
        <div className="px-3 py-2 mb-1">
          <BackedByMicrosoft variant="dark" compact />
        </div>
        {NAV_SECONDARY.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={navClass}
            onClick={() => mobile && onNavigate?.()}
          >
            <item.icon size={18} />
            {item.name}
          </NavLink>
        ))}
        <button
          type="button"
          onClick={onLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-300 hover:bg-red-500/20 w-full text-left mt-1 transition-colors duration-200"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  );
}

const DashboardLayout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const appDark = useAppThemeDark();

  const handleLogout = async () => {
    await logoutApi().catch(() => {});
    setToken(null);
    localStorage.removeItem('medscan_refresh');
    localStorage.removeItem('medscan_user');
    dispatch(logout());
    navigate('/login');
  };

  const pageTitle =
    [...NAV_PRIMARY, ...NAV_SECONDARY].find((i) => i.href === location.pathname)?.name ||
    'Dashboard';

  return (
    <div
      className={`h-[100dvh] flex bg-surface dark:bg-navy text-navy dark:text-slate-100 overflow-hidden${appDark ? ' theme-dark' : ''}`}
    >
      <aside className="hidden md:flex relative w-[17rem] lg:w-64 shrink-0 bg-navy flex-col border-r border-white/5 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-teal/15 via-transparent to-lime/10 opacity-60" aria-hidden />
        <div className="relative z-10 flex flex-col h-full">
          <DashboardSidebar onLogout={handleLogout} />
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-navy/70 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          />
          <aside className="relative w-[min(18rem,88vw)] h-full bg-navy shadow-2xl">
            <DashboardSidebar mobile onNavigate={() => setSidebarOpen(false)} onLogout={handleLogout} />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <header className="h-14 sm:h-16 shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 sm:px-6 lg:px-8 pt-[env(safe-area-inset-top)] min-h-[calc(3.5rem+env(safe-area-inset-top))] sm:min-h-[calc(4rem+env(safe-area-inset-top))]">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              className="md:hidden p-2 -ml-1 dash-text rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>
            <div className="min-w-0 md:hidden">
              <Logo to="/dashboard" size="sm" theme="on-light" />
            </div>
            <div className="min-w-0 hidden md:block">
              <p className="text-[10px] sm:text-xs font-bold text-teal uppercase tracking-wider">MedMx LABS</p>
              <h1 className="text-base sm:text-lg font-bold dash-text truncate">{pageTitle}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 sm:border-l sm:border-slate-200 dark:sm:border-slate-700">
            <div className="h-9 w-9 rounded-full bg-brand-gradient flex items-center justify-center text-white shadow-sm shrink-0">
              <UserIcon size={16} />
            </div>
            <div className="hidden sm:block min-w-0 text-right sm:text-left">
              <p className="text-sm font-bold dash-text truncate max-w-[10rem] lg:max-w-[12rem]">
                {user?.name || user?.email?.split('@')[0] || 'Account'}
              </p>
              <p className="text-xs dash-muted truncate max-w-[10rem] lg:max-w-[12rem]">{user?.email}</p>
            </div>
          </div>
        </header>

        <main className="dash-main flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 pb-[max(1rem,env(safe-area-inset-bottom))] bg-slate-50 dark:bg-navy bg-gradient-to-br from-slate-50 via-white to-teal/[0.04] dark:from-navy dark:via-[#0f2744] dark:to-[#0a192f] dot-grid overscroll-y-contain">
          <Suspense fallback={<LoadingState />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
