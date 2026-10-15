import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { Sidebar } from "../components/Sidebar";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { SafetyDisclaimerBanner } from "../components/SafetyDisclaimerBanner";

export const DashboardLayout: React.FC = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar
          isOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
        />

        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          <Breadcrumbs />
          <SafetyDisclaimerBanner />
          <Outlet />
        </main>
      </div>

      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong>JalRakshak AI</strong> &copy; 2026 Build To Ship Innovation Initiative.
          </div>
          <div className="text-[11px] text-slate-400">
            Adhering to Indian Standard IS 10500:2012 Drinking Water Specification.
          </div>
        </div>
      </footer>
    </div>
  );
};
