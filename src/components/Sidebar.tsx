import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  MapPin,
  Map,
  FlaskConical,
  AlertTriangle,
  ClipboardCheck,
  Microscope,
  BarChart3,
  ShieldCheck,
  Info
} from "lucide-react";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const navItems = [
    { name: "Overview Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Water Sources", path: "/sources", icon: MapPin },
    { name: "Water-Risk Map", path: "/map", icon: Map },
    { name: "Quality Measurements", path: "/measurements", icon: FlaskConical },
    { name: "Alerts & Warnings", path: "/alerts", icon: AlertTriangle },
    { name: "Field Inspections", path: "/inspections", icon: ClipboardCheck },
    { name: "Laboratory Reports", path: "/laboratory", icon: Microscope },
    { name: "Analytics & Reports", path: "/analytics", icon: BarChart3 },
  ];

  const content = (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800 text-slate-300 w-64 select-none">
      {/* Navigation Links */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Surveillance Modules
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-teal-500/20 to-teal-500/5 text-teal-300 font-semibold border-l-3 border-teal-400 shadow-xs"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Standard Reference Badge & Version */}
      <div className="p-3.5 m-3 rounded-xl bg-slate-800/70 border border-slate-700/80">
        <div className="flex items-center gap-2 mb-1.5 text-teal-300 font-semibold text-xs">
          <ShieldCheck className="w-4 h-4 text-teal-400" />
          <span>IS 10500:2012 Engine</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-snug">
          Screening according to Bureau of Indian Standards (Drinking Water Second Revision).
        </p>
        <div className="mt-2.5 pt-2 border-t border-slate-700 text-[10px] text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            AI Node Active
          </span>
          <span className="font-mono">v1.0-prod</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Permanent) */}
      <aside className="hidden lg:block w-64 shrink-0 min-h-[calc(100vh-4rem)]">
        {content}
      </aside>

      {/* Mobile Drawer (Collapsible) */}
      {isOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-900 z-50 shadow-2xl">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
