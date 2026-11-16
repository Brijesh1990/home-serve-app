import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { BRAND, ROLE_NAVIGATION } from '../../constants';
import { useAuth } from '../../hooks/useAuth';
import { notificationService } from '../../services/notificationService';

export const DashboardLayout = ({
  role = 'admin',
  activeTab,
  setActiveTab,
  title,
  subtitle,
  searchQuery = '',
  setSearchQuery,
  headerActions,
  children,
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = ROLE_NAVIGATION[role] || ROLE_NAVIGATION.customer;

  useEffect(() => {
    notificationService.getNotifications().then(setNotifications);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkRead = async (id) => {
    const updated = await notificationService.markAsRead(id);
    setNotifications(updated);
  };

  const handleMarkAllRead = async () => {
    const updated = await notificationService.markAllAsRead();
    setNotifications(updated);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const currentNavLabel =
    navItems.find((item) => item.id === activeTab)?.label || title || 'Overview';

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] text-[#1E293B]">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-[#0F172A] text-slate-300 transition-all duration-300 shrink-0 border-r border-slate-800 ${
          sidebarCollapsed ? 'w-20' : 'w-68'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800">
          <Link to="/" className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#6366F1] flex items-center justify-center text-white shrink-0">
              <Icons.ShieldCheck className="w-5 h-5" />
            </div>
            {!sidebarCollapsed && (
              <div>
                <span className="text-lg font-extrabold text-white tracking-tight">
                  Home<span className="text-[#3B82F6]">Serve</span>
                </span>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  {role} Workspace
                </p>
              </div>
            )}
          </Link>
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Toggle Sidebar"
          >
            {sidebarCollapsed ? (
              <Icons.ChevronRight className="w-4 h-4" />
            ) : (
              <Icons.ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const IconComp = Icons[item.icon] || Icons.Circle;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  isActive
                    ? 'bg-[#2563EB] text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                }`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <IconComp className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </div>

        {/* Bottom User Card */}
        <div className="p-3 border-t border-slate-800 space-y-2">
          {!sidebarCollapsed && (
            <div className="px-3 py-2 rounded-xl bg-slate-800/70 border border-slate-700/70">
              <p className="text-xs font-bold text-white truncate">
                {user?.full_name || 'Demo User'}
              </p>
              <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
              title="Back to Public Website"
            >
              <Icons.Home className="w-4 h-4" />
              {!sidebarCollapsed && <span>Website</span>}
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition cursor-pointer"
              title="Sign Out"
            >
              <Icons.LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-72 bg-[#0F172A] text-slate-200 flex flex-col z-10">
            <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800">
              <span className="text-lg font-extrabold text-white">
                Home<span className="text-[#3B82F6]">Serve</span> ({role})
              </span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <Icons.X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {navItems.map((item) => {
                const IconComp = Icons[item.icon] || Icons.Circle;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold ${
                      isActive
                        ? 'bg-[#2563EB] text-white'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <IconComp className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-slate-200 text-slate-600"
            >
              <Icons.Menu className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                <span className="capitalize">{role} Portal</span>
                <Icons.ChevronRight className="w-3.5 h-3.5" />
                <span className="text-[#2563EB] font-semibold">{currentNavLabel}</span>
              </div>
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 truncate">
                {title || currentNavLabel}
              </h1>
            </div>
          </div>

          {/* Search, Notifications & Profile */}
          <div className="flex items-center gap-3">
            {setSearchQuery && (
              <div className="hidden md:flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 w-64">
                <Icons.Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Quick filter records..."
                  className="bg-transparent text-xs text-slate-700 focus:outline-none w-full"
                />
              </div>
            )}

            {headerActions}

            {/* Notification Bell Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                aria-label="Notifications"
              >
                <Icons.Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#DC2626] text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      Notifications ({unreadCount} unread)
                    </span>
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      className="text-[11px] font-semibold text-[#2563EB] hover:underline cursor-pointer"
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleMarkRead(n.id)}
                        className={`p-3.5 text-xs cursor-pointer hover:bg-slate-50 transition ${
                          !n.is_read ? 'bg-blue-50/40' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-bold text-slate-800">{n.title}</span>
                          {!n.is_read && (
                            <span className="w-2 h-2 rounded-full bg-[#2563EB] shrink-0" />
                          )}
                        </div>
                        <p className="text-slate-600 leading-relaxed">{n.message}</p>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          {n.created_at}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User Pill */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#6366F1] text-white flex items-center justify-center font-bold text-xs">
                {(user?.full_name || 'U').charAt(0)}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-slate-800 leading-none">
                  {user?.full_name || 'HomeServe User'}
                </p>
                <p className="text-[10px] text-slate-500 capitalize mt-0.5">{role}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto space-y-6">
          {subtitle && (
            <div className="bg-gradient-to-r from-[#0F172A] via-slate-900 to-[#1E293B] text-white rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#F59E0B]">
                  {BRAND.name} • {BRAND.tagline}
                </span>
                <h2 className="text-lg sm:text-xl font-extrabold mt-0.5">{subtitle}</h2>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to="/services"
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition"
                >
                  Browse Marketplace
                </Link>
                <Link
                  to="/checkout"
                  className="px-3.5 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-500 text-white text-xs font-bold transition"
                >
                  + New Booking
                </Link>
              </div>
            </div>
          )}

          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
