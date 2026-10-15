import React from "react";
import {
  CheckCircle,
  AlertTriangle,
  AlertOctagon,
  Activity,
  Clock,
  HelpCircle,
} from "lucide-react";

interface StatusBadgeProps {
  status?: string;
  size?: "sm" | "md" | "lg";
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = "md" }) => {
  if (!status) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
        <HelpCircle className="w-3.5 h-3.5" /> No Data
      </span>
    );
  }

  const s = status.toLowerCase();

  // 1. Screening Statuses
  if (s.includes("desirable") || s.includes("normal") || s.includes("compliant") || s.includes("verified")) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
        {status}
      </span>
    );
  }

  if (s.includes("urgent") || s.includes("critical") || s.includes("severely")) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 animate-pulse">
        <AlertOctagon className="w-3.5 h-3.5 text-red-600" />
        {status}
      </span>
    );
  }

  if (s.includes("threshold exceeded") || s.includes("warning") || s.includes("high")) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
        {status}
      </span>
    );
  }

  if (s.includes("unusual") || s.includes("medium") || s.includes("in progress")) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
        <Activity className="w-3.5 h-3.5 text-indigo-600" />
        {status}
      </span>
    );
  }

  if (s.includes("stale") || s.includes("insufficient") || s.includes("open") || s.includes("assigned")) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-300">
        <Clock className="w-3.5 h-3.5 text-slate-500" />
        {status}
      </span>
    );
  }

  if (s.includes("resolved") || s.includes("closed")) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
        <CheckCircle className="w-3.5 h-3.5 text-teal-600" />
        {status}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
      {status}
    </span>
  );
};
