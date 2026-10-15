import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Droplets,
  AlertOctagon,
  AlertTriangle,
  ClipboardCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  RefreshCw,
  PlusCircle,
  FlaskConical,
  MapPin,
  TrendingUp,
  Activity,
  Layers
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from "recharts";
import { api } from "../services/api";
import { DashboardStats } from "../types";
import { StatusBadge } from "../components/StatusBadge";
import { SkeletonLoader } from "../components/SkeletonLoader";

const PIE_COLORS = {
  "Within Desirable Thresholds (Preliminary)": "#10b981", // green
  "Threshold Exceeded - Additional Testing Recommended": "#f59e0b", // amber
  "Urgent Investigation Recommended": "#ef4444", // red
  "Unusual Pattern Detected": "#6366f1", // indigo
  "Stale / Insufficient Data": "#94a3b8", // gray
};

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [dashData, reportData] = await Promise.all([
        api.dashboard.get(),
        api.reports.getSummary(),
      ]);
      setStats(dashData);
      setTrends(reportData.trend_series || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard surveillance data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleQuickSimulate = async (scenario: string) => {
    if (!stats || stats.recent_readings.length === 0) return;
    const targetSourceId = stats.recent_readings[0].source_id;
    setRefreshing(true);
    try {
      await api.measurements.simulate(targetSourceId, scenario);
      await fetchData();
    } catch (err: any) {
      alert(`Simulation failed: ${err.message}`);
      setRefreshing(false);
    }
  };

  if (loading) return <SkeletonLoader rows={6} />;

  if (error || !stats) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700">
        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <h3 className="font-bold text-base">Backend Connection Notice</h3>
        <p className="text-xs text-red-600 mt-1">{error}</p>
        <button
          onClick={handleRefresh}
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  // Format pie chart data
  const pieData = Object.entries(stats.screening_distribution).map(([name, value]) => ({
    name,
    value,
  }));

  // Format source type bar data
  const barData = Object.entries(stats.source_type_distribution).map(([type, count]) => ({
    type,
    count,
  }));

  return (
    <div className="space-y-6">
      {/* Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-teal-600" />
            Central Water Surveillance Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Active telemetry monitoring &bull; IS 10500:2012 screening standards &bull; Real-time outlier detection
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            title="Refresh database records"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-teal-600" : ""}`} />
            Refresh
          </button>

          <Link
            to="/measurements"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Log Reading
          </Link>
        </div>
      </div>

      {/* Primary Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3.5 sm:gap-4">
        {/* Total Sources */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Registered Sources</span>
            <Droplets className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-slate-900">{stats.total_sources}</span>
            <span className="text-[11px] text-teal-600 block mt-0.5">
              {stats.active_sources} active monitored
            </span>
          </div>
        </div>

        {/* Compliant Rate */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">IS 10500 Compliant</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-emerald-700">
              {stats.compliance_summary.rate_percentage}%
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              {stats.compliance_summary.compliant_sources} within desirable limits
            </span>
          </div>
        </div>

        {/* Requiring Follow-up */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Needs Follow-Up</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-amber-700">{stats.sources_requiring_followup}</span>
            <span className="text-[11px] text-amber-600 block mt-0.5">
              Exceedance or alert active
            </span>
          </div>
        </div>

        {/* Unresolved Alerts */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Active Alerts</span>
            <AlertOctagon className="w-4 h-4 text-red-500" />
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-red-600">{stats.unresolved_alerts_count}</span>
              {stats.critical_alerts_count > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">
                  {stats.critical_alerts_count} Critical
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              Awaiting resolution
            </span>
          </div>
        </div>

        {/* Pending Inspections */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Field Tasks</span>
            <ClipboardCheck className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-indigo-700">{stats.pending_inspections_count}</span>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              Sanitary inspections
            </span>
          </div>
        </div>

        {/* Freshness / Stale Data */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">Surveillance Gaps</span>
            <Clock className="w-4 h-4 text-slate-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-slate-700">{stats.stale_sources_count}</span>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              &gt; 7 days without readings
            </span>
          </div>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Historical Trends (Line chart) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-teal-600" />
                Water Quality Chronological Trends
              </h3>
              <p className="text-[11px] text-slate-500">
                pH and Turbidity (NTU) fluctuations across monitored water points
              </p>
            </div>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md font-medium">
              Baseline Timeline
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends.slice(-15)} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#64748b" }} />
                <YAxis yAxisId="left" domain={[5, 10]} tick={{ fontSize: 10, fill: "#64748b" }} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 10]} tick={{ fontSize: 10, fill: "#64748b" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    color: "#f8fafc",
                    borderRadius: "0.5rem",
                    fontSize: "11px",
                    border: "none",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="ph"
                  name="pH (6.5 - 8.5 limit)"
                  stroke="#0d9488"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="turbidity"
                  name="Turbidity NTU (< 1.0 desirable)"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Screening Status Distribution (Donut chart) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-teal-600" />
              Screening Distribution
            </h3>
            <p className="text-[11px] text-slate-500 mb-2">
              Preliminary categorization against IS 10500 standards
            </p>
          </div>

          <div className="h-52 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={(PIE_COLORS as any)[entry.name] || "#64748b"}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    color: "#f8fafc",
                    borderRadius: "0.5rem",
                    fontSize: "11px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 text-[11px] pt-2 border-t border-slate-100">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1.5 truncate max-w-[200px]" title={d.name}>
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: (PIE_COLORS as any)[d.name] || "#64748b" }}
                  />
                  {d.name.split(" - ")[0]}
                </span>
                <span className="font-bold text-slate-900">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Telemetry Scenario Testing Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-4 rounded-2xl text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-300 flex items-center justify-center shrink-0">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-teal-300 flex items-center gap-2">
              Interactive Telemetry & Contamination Simulator
              <span className="text-[10px] bg-teal-500/30 text-teal-200 px-2 py-0.5 rounded-full font-mono">
                Live Test
              </span>
            </h4>
            <p className="text-xs text-slate-300 mt-0.5">
              Simulate sensor data stream scenarios to verify automated AI screening and early warning dispatch in real-time.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          <button
            onClick={() => handleQuickSimulate("normal")}
            disabled={refreshing}
            className="px-3 py-1.5 rounded-lg bg-emerald-600/80 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors shadow-xs"
          >
            + Normal Baseline
          </button>
          <button
            onClick={() => handleQuickSimulate("high_turbidity_monsoon")}
            disabled={refreshing}
            className="px-3 py-1.5 rounded-lg bg-amber-600/80 hover:bg-amber-600 text-white text-xs font-semibold transition-colors shadow-xs"
          >
            + Turbidity Surge
          </button>
          <button
            onClick={() => handleQuickSimulate("acidic_industrial")}
            disabled={refreshing}
            className="px-3 py-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-white text-xs font-semibold transition-colors shadow-xs"
          >
            + Acidic Alert (Critical)
          </button>
          <button
            onClick={() => handleQuickSimulate("high_tds_saline")}
            disabled={refreshing}
            className="px-3 py-1.5 rounded-lg bg-cyan-700/80 hover:bg-cyan-700 text-white text-xs font-semibold transition-colors shadow-xs"
          >
            + High Salinity TDS
          </button>
        </div>
      </div>

      {/* Two Column Layout: Recent Readings & Recent Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Readings Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <FlaskConical className="w-4 h-4 text-teal-600" />
                Recent Water Quality Screenings
              </h3>
              <p className="text-[11px] text-slate-500">
                Latest field parameters and preliminary compliance status
              </p>
            </div>
            <Link
              to="/measurements"
              className="text-xs text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1"
            >
              View All ({stats.total_measurements}) &rarr;
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <th className="py-2.5 px-4 font-semibold">Water Source</th>
                  <th className="py-2.5 px-3 font-semibold">pH</th>
                  <th className="py-2.5 px-3 font-semibold">Turbidity</th>
                  <th className="py-2.5 px-3 font-semibold">TDS</th>
                  <th className="py-2.5 px-4 font-semibold">Screening Outcome</th>
                  <th className="py-2.5 px-3 font-semibold">Recorded</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.recent_readings.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <Link
                        to={`/sources/${r.source_id}`}
                        className="font-semibold text-slate-900 hover:text-teal-600 block truncate max-w-[160px]"
                      >
                        {r.source_name}
                      </Link>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {r.source_code} &bull; {r.locality}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-medium">
                      <span className={r.ph && (r.ph < 6.5 || r.ph > 8.5) ? "text-red-600 font-bold" : "text-slate-800"}>
                        {r.ph?.toFixed(2) ?? "-"}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-medium">
                      <span className={r.turbidity && r.turbidity > 1.0 ? "text-amber-600 font-bold" : "text-slate-800"}>
                        {r.turbidity ? `${r.turbidity.toFixed(1)} NTU` : "-"}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-medium">
                      <span className={r.tds && r.tds > 500 ? "text-amber-600 font-bold" : "text-slate-800"}>
                        {r.tds ? `${r.tds.toFixed(0)} mg/L` : "-"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={r.screening_status} size="sm" />
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-[11px]">
                      {new Date(r.timestamp).toLocaleDateString([], { month: "short", day: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Early Warning Alerts */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <AlertOctagon className="w-4 h-4 text-red-500" />
                Active Early Warnings
              </h3>
              <p className="text-[11px] text-slate-500">
                Unresolved risk indicators requiring action
              </p>
            </div>
            <Link
              to="/alerts"
              className="text-xs text-teal-600 hover:text-teal-700 font-semibold"
            >
              Alert Center &rarr;
            </Link>
          </div>

          <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-96">
            {stats.recent_alerts.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                No active contamination alerts. All monitored parameters nominal.
              </div>
            ) : (
              stats.recent_alerts.map((a) => (
                <div
                  key={a.id}
                  className={`p-3 rounded-xl border transition-colors ${
                    a.severity === "Critical"
                      ? "bg-red-50/70 border-red-200"
                      : a.severity === "High"
                      ? "bg-amber-50/70 border-amber-200"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900 line-clamp-1">
                      {a.title}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        a.severity === "Critical"
                          ? "bg-red-200 text-red-800"
                          : a.severity === "High"
                          ? "bg-amber-200 text-amber-800"
                          : "bg-slate-200 text-slate-800"
                      }`}
                    >
                      {a.severity}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                    <span>{a.source_name}</span>
                    <span>{new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
            <Link
              to="/map"
              className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <MapPin className="w-3.5 h-3.5 text-teal-400" />
              <span>Inspect on Water-Risk Map</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
