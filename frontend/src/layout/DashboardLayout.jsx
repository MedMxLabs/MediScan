import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';
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
  X,
  MapPin,
  User as UserIcon,
} from 'lucide-react';
import Logo from '../components/Logo';

const NAV_PRIMARY = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Search Medicine', href: '/dashboard/search', icon: Search },
  { name: 'Upload Prescription', href: '/dashboard/upload', icon: Upload },
  { name: 'Medicine History', href: '/dashboard/history', icon: History },
  { name: 'Reminders', href: '/dashboard/reminders', icon: Bell },
  { name: 'Adherence', href: '/dashboard/adherence', icon: TrendingUp },
  { name: 'Lab Reports', href: '/dashboard/reports', icon: FileText },
  { name: 'Nearby Pharmacies', href: '/dashboard/pharmacies', icon: MapPin },
  { name: 'AI Assistant', href: '/dashboard/assistant', icon: MessageSquare },
];

const NAV_SECONDARY = [{ name: 'Profile & Settings', href: '/dashboard/profile', icon: Settings }];

const navClass = ({ isActive }) =>
  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
    isActive
      ? 'bg-brand-gradient text-white shadow-brand'
      : 'text-slate-300 hover:bg-white/10 hover:text-white'
  }`;

const DashboardLayout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('medscan_refresh');
    localStorage.removeItem('medscan_user');
    dispatch(logout());
    navigate('/login');
  };

  const pageTitle =
    [...NAV_PRIMARY, ...NAV_SECONDARY].find((i) => i.href === location.pathname)?.name ||
    'Dashboard';

  const Sidebar = ({ mobile = false }) => (
    <div className={`flex flex-col h-full ${mobile ? '' : ''}`}>
      <div className="h-16 flex items-center px-5 border-b border-white/10 shrink-0">
        <Logo to="/dashboard" size="sm" theme="on-dark" />
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {NAV_PRIMARY.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.href === '/dashboard'}
            className={navClass}
            onClick={() => mobile && setSidebarOpen(false)}
          >
            <item.icon size={18} className="shrink-0" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-white/10 space-y-1 shrink-0">
        {NAV_SECONDARY.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={navClass}
            onClick={() => mobile && setSidebarOpen(false)}
          >
            <item.icon size={18} />
            {item.name}
          </NavLink>
        ))}
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-300 hover:bg-red-500/20 w-full text-left mt-1"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex bg-surface text-navy overflow-hidden">
      <aside className="hidden md:flex w-64 shrink-0 bg-navy flex-col">
        <Sidebar />
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-navy/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          />
          <aside className="relative w-72 max-w-[85vw] h-full bg-navy shadow-2xl">
            <Sidebar mobile />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 shrink-0 glass border-b border-slate-200/60 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              className="md:hidden p-2 -ml-1 text-navy rounded-lg hover:bg-slate-100"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={22} />
            </button>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-teal uppercase tracking-wider">MedMx LABS</p>
              <h1 className="text-lg font-bold text-navy truncate">{pageTitle}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
            <div className="h-9 w-9 rounded-full bg-brand-gradient-soft border border-teal/30 flex items-center justify-center text-teal">
              <UserIcon size={16} />
            </div>
            <div className="hidden sm:block min-w-0">
              <p className="text-sm font-bold text-navy truncate max-w-[140px]">
                {user?.name || user?.email?.split('@')[0] || 'Account'}
              </p>
              <p className="text-xs text-muted truncate max-w-[140px]">{user?.email}</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
