import React, { useState, useEffect } from "react";
import {
  BarChart3,
  Download,
  Calendar,
  ShieldCheck,
  TrendingUp,
  Activity,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  Clock,
  Layers,
  Percent
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  CartesianGrid
} from "recharts";
import { api } from "../services/api";
import { SkeletonLoader } from "../components/SkeletonLoader";
import { StatusBadge } from "../components/StatusBadge";

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSummary() {
      try {
        setLoading(true);
        const res = await api.reports.getSummary();
        setData(res);
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadSummary();
  }, []);

  if (loading) return <SkeletonLoader rows={6} />;

  if (!data) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <h3 className="font-bold text-slate-800">Analytics data currently unavailable</h3>
      </div>
    );
  }

  // TDS Bar data by source
  const tdsBySource = (data.sources_summary || []).map((s: any) => ({
    name: s.source_code,
    fullName: s.name,
    tds: s.latest_tds || 0,
    ph: s.latest_ph || 0,
    turbidity: s.latest_turbidity || 0,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-teal-600" />
            Environmental Analytics & Regulatory Compliance Reporting
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Statistical distribution of drinking water indicators benchmarked against IS 10500:2012
          </p>
        </div>

        {/* Quick CSV Export Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={api.reports.getExportUrl("measurements")}
            download
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Measurements CSV
          </a>
          <a
            href={api.reports.getExportUrl("sources")}
            download
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-teal-600" />
            Sources CSV
          </a>
          <a
            href={api.reports.getExportUrl("alerts")}
            download
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-amber-600" />
            Alerts CSV
          </a>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium block">Total Screened Records</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block font-mono">
            {data.total_readings}
          </span>
          <span className="text-[11px] text-teal-600 mt-0.5 block">
            Across {data.total_sources} registered locations
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium block">Inspection Resolution Rate</span>
          <span className="text-2xl font-bold text-emerald-700 mt-1 block font-mono">
            {data.inspection_metrics?.resolution_rate_percent}%
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            {data.inspection_metrics?.resolved} of {data.inspection_metrics?.total} tasks closed
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium block">Authoritative Standard</span>
          <span className="text-sm font-bold text-slate-900 mt-1 block">
            IS 10500:2012
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            Bureau of Indian Standards
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium block">Multivariate AI Method</span>
          <span className="text-sm font-bold text-indigo-700 mt-1 block">
            Isolation Forest
          </span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            Scikit-Learn baseline outlier modeling
          </span>
        </div>
      </div>

      {/* Comparative Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TDS by Source Bar Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-teal-600" />
            TDS Concentration Across Monitored Sources (mg/L)
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Benchmark: &lt; 500 mg/L (Desirable limit), &lt; 2000 mg/L (Max permissible)
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tdsBySource} margin={{ top: 5, right: 10, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} />
                <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    color: "#f8fafc",
                    borderRadius: "0.5rem",
                    fontSize: "11px",
                  }}
                />
                <Bar dataKey="tds" name="TDS (mg/L)" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* pH Distribution Bar Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-cyan-600" />
            pH Distribution Benchmark (IS 10500: 6.5 - 8.5)
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Safe drinking water balance range: 6.5 to 8.5
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tdsBySource} margin={{ top: 5, right: 10, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} />
                <YAxis domain={[4, 10]} tick={{ fontSize: 10, fill: "#64748b" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    color: "#f8fafc",
                    borderRadius: "0.5rem",
                    fontSize: "11px",
                  }}
                />
                <Bar dataKey="ph" name="pH Value" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Comprehensive Source Summary Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Cross-Source Asset Compliance Matrix
            </h3>
            <p className="text-xs text-slate-500">
              Aggregated surveillance counts, latest parameters, and status classifications
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                <th className="py-3 px-4">Source Code & Name</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">District</th>
                <th className="py-3 px-3 text-center">Readings Count</th>
                <th className="py-3 px-3 font-mono">Latest pH</th>
                <th className="py-3 px-3 font-mono">Latest Turbidity</th>
                <th className="py-3 px-3 font-mono">Latest TDS</th>
                <th className="py-3 px-4">Preliminary Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(data.sources_summary || []).map((s: any) => (
                <tr key={s.source_id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-900 block">{s.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{s.source_code}</span>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                      {s.source_type}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-slate-700">{s.district}</td>
                  <td className="py-3.5 px-3 text-center font-mono font-medium">{s.readings_count}</td>
                  <td className="py-3.5 px-3 font-mono font-medium">
                    <span className={s.latest_ph && (s.latest_ph < 6.5 || s.latest_ph > 8.5) ? "text-red-600 font-bold" : "text-slate-800"}>
                      {s.latest_ph ? s.latest_ph.toFixed(2) : "-"}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 font-mono font-medium">
                    <span className={s.latest_turbidity && s.latest_turbidity > 1.0 ? "text-amber-600 font-bold" : "text-slate-800"}>
                      {s.latest_turbidity ? `${s.latest_turbidity.toFixed(1)} NTU` : "-"}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 font-mono font-medium">
                    <span className={s.latest_tds && s.latest_tds > 500 ? "text-amber-600 font-bold" : "text-slate-800"}>
                      {s.latest_tds ? `${s.latest_tds.toFixed(0)} mg/L` : "-"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusBadge status={s.latest_status} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
