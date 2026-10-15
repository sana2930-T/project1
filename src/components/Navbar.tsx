import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Droplets,
  Bell,
  User as UserIcon,
  Shield,
  Menu,
  X,
  ExternalLink,
  ChevronDown,
  LogOut,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { UserRole } from "../types";

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, logout, quickSwitchRole } = useAuth();
  const navigate = useNavigate();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const notifs = await api.alerts.getNotifications();
        setNotifications(notifs.slice(0, 5));
      } catch {
        // quiet fallback
      }
    }
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleRoleSwitch = async (role: UserRole) => {
    await quickSwitchRole(role);
    setUserDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-slate-100 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand & Mobile Menu */}
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform">
              <Droplets className="w-5 h-5 text-slate-950 fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-cyan-100 to-teal-200 bg-clip-text text-transparent">
                  JalRakshak AI
                </span>
                <span className="text-[10px] font-mono uppercase bg-teal-500/20 text-teal-300 border border-teal-500/40 px-1.5 py-0.2 rounded font-semibold">
                  v1.0
                </span>
              </div>
              <p className="text-[10px] text-slate-400 -mt-1 hidden sm:block">
                Water Surveillance & Risk Screening
              </p>
            </div>
          </Link>
        </div>

        {/* Center: Demo Quick Role Switcher Pills */}
        <div className="hidden md:flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700/80">
          <span className="text-[11px] text-slate-400 px-2 font-medium flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-teal-400" />
            Demo Role:
          </span>
          {(["Admin", "Field Officer", "Community Viewer"] as UserRole[]).map((r) => {
            const isActive = user?.role === r;
            return (
              <button
                key={r}
                onClick={() => handleRoleSwitch(r)}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                  isActive
                    ? "bg-teal-500 text-slate-950 font-bold shadow-xs"
                    : "text-slate-300 hover:text-white hover:bg-slate-700/60"
                }`}
              >
                {r}
              </button>
            );
          })}
        </div>

        {/* Right: Notification Center & User Menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notification dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setNotificationsOpen(!notificationsOpen);
                setUserDropdownOpen(false);
              }}
              className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {notifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-slate-900 animate-pulse" />
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3 z-50 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                  <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-teal-400" />
                    Surveillance Notifications
                  </h4>
                  <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                    {notifications.length} Recent
                  </span>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs">
                      No recent alert dispatches.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className="p-2.5 rounded-lg bg-slate-800/70 border border-slate-700/60 hover:bg-slate-800 transition-colors text-left"
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <span className="text-xs font-semibold text-cyan-300">
                            {n.title}
                          </span>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {n.channel}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-1 line-clamp-2">
                          {n.message}
                        </p>
                        <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
                          <span>{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="text-teal-400">{n.delivery_status}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-2 pt-2 border-t border-slate-800 text-center">
                  <Link
                    to="/alerts"
                    onClick={() => setNotificationsOpen(false)}
                    className="text-xs text-teal-400 hover:text-teal-300 font-medium inline-block"
                  >
                    View All Active Early Warnings &rarr;
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User profile dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setUserDropdownOpen(!userDropdownOpen);
                setNotificationsOpen(false);
              }}
              className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl hover:bg-slate-800 text-slate-200 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/40 text-teal-300 flex items-center justify-center font-bold text-xs">
                {user ? user.full_name[0] : "U"}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-semibold leading-tight text-slate-100">
                  {user ? user.full_name.split(" ")[0] : "Demo User"}
                </div>
                <div className="text-[10px] text-teal-400 leading-tight">
                  {user?.role || "Viewer"}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 text-left animate-fadeIn">
                <div className="p-2 border-b border-slate-800 mb-1">
                  <p className="text-xs font-semibold text-white">{user?.full_name}</p>
                  <p className="text-[11px] text-slate-400">{user?.email}</p>
                  <p className="text-[10px] text-teal-400 mt-0.5">{user?.department}</p>
                </div>

                <div className="py-1">
                  <span className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Switch Role (Demo)
                  </span>
                  {(["Admin", "Field Officer", "Community Viewer"] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => handleRoleSwitch(r)}
                      className={`w-full text-left px-2 py-1.5 text-xs rounded-lg flex items-center justify-between ${
                        user?.role === r
                          ? "bg-teal-500/20 text-teal-300 font-semibold"
                          : "text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      <span>{r}</span>
                      {user?.role === r && <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />}
                    </button>
                  ))}
                </div>

                <div className="pt-1 mt-1 border-t border-slate-800">
                  <Link
                    to="/dashboard"
                    onClick={() => setUserDropdownOpen(false)}
                    className="block px-2 py-1.5 text-xs text-slate-300 hover:bg-slate-800 rounded-lg"
                  >
                    Open Main Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setUserDropdownOpen(false);
                      navigate("/");
                    }}
                    className="w-full text-left px-2 py-1.5 text-xs text-red-400 hover:bg-slate-800 rounded-lg flex items-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
