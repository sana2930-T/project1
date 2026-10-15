import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  Filter,
  Download,
  ShieldAlert,
  Bell,
  Check,
  Send,
  MessageSquare
} from "lucide-react";
import { api } from "../services/api";
import { Alert, AlertSeverity, AlertStatus } from "../types";
import { StatusBadge } from "../components/StatusBadge";
import { Modal } from "../components/Modal";
import { SkeletonLoader } from "../components/SkeletonLoader";
import { useAuth } from "../context/AuthContext";

export const AlertsPage: React.FC = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"alerts" | "notifications">("alerts");

  // Resolve Modal State
  const [resolvingAlert, setResolvingAlert] = useState<Alert | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [alts, notifs] = await Promise.all([
        api.alerts.getAll({
          severity: severityFilter || undefined,
          status: statusFilter || undefined,
          search: search || undefined,
        }),
        api.alerts.getNotifications(),
      ]);
      setAlerts(alts);
      setNotifications(notifs);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [severityFilter, statusFilter, search]);

  const handleAcknowledge = async (id: number) => {
    try {
      await api.alerts.acknowledge(id);
      fetchData();
    } catch (err: any) {
      alert(`Error acknowledging alert: ${err.message}`);
    }
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingAlert) return;
    if (!resolutionNotes || resolutionNotes.trim().length < 5) {
      alert("Please provide detailed resolution notes describing corrective action.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.alerts.resolve(resolvingAlert.id, resolutionNotes);
      setResolvingAlert(null);
      setResolutionNotes("");
      fetchData();
    } catch (err: any) {
      alert(`Error resolving alert: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const criticalCount = alerts.filter((a) => a.severity === "Critical" && a.status === "Active").length;
  const highCount = alerts.filter((a) => a.severity === "High" && a.status === "Active").length;
  const resolvedCount = alerts.filter((a) => a.status === "Resolved").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-red-600" />
            Early Warning Alert & Dispatch Center
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Deduplicated real-time alarms, severity escalation, acknowledgement, and corrective action tracking
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <a
            href={api.reports.getExportUrl("alerts")}
            download
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Export Alerts CSV
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("alerts")}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === "alerts"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          Active & Resolved Alerts ({alerts.length})
        </button>
        <button
          onClick={() => setActiveTab("notifications")}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === "notifications"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          Notification Dispatch Events ({notifications.length})
        </button>
      </div>

      {activeTab === "alerts" ? (
        <>
          {/* Summary Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-red-900 block">Critical Unresolved</span>
                <span className="text-2xl font-extrabold text-red-700 mt-0.5 block">{criticalCount}</span>
                <span className="text-[10px] text-red-600">Immediate hazard advisory required</span>
              </div>
              <AlertOctagon className="w-8 h-8 text-red-500 shrink-0" />
            </div>

            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-amber-900 block">High Severity Warnings</span>
                <span className="text-2xl font-extrabold text-amber-700 mt-0.5 block">{highCount}</span>
                <span className="text-[10px] text-amber-600">Testing & flushing recommended</span>
              </div>
              <AlertTriangle className="w-8 h-8 text-amber-500 shrink-0" />
            </div>

            <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-teal-900 block">Resolved Cases</span>
                <span className="text-2xl font-extrabold text-teal-700 mt-0.5 block">{resolvedCount}</span>
                <span className="text-[10px] text-teal-600">Corrective actions documented</span>
              </div>
              <CheckCircle className="w-8 h-8 text-teal-500 shrink-0" />
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search alerts by title, code, or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="w-full py-1.5 px-3 text-xs rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="">All Severities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full py-1.5 px-3 text-xs rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Acknowledged">Acknowledged</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
          </div>

          {/* Alerts List */}
          {loading ? (
            <SkeletonLoader rows={5} />
          ) : alerts.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500">
              <CheckCircle className="w-10 h-10 text-teal-400 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-800">No alerts match criteria</h3>
              <p className="text-xs text-slate-400 mt-1">All parameters are within acceptable thresholds.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((a) => (
                <div
                  key={a.id}
                  className={`bg-white p-5 rounded-2xl border shadow-xs transition-all ${
                    a.severity === "Critical"
                      ? "border-red-300 ring-1 ring-red-100"
                      : a.severity === "High"
                      ? "border-amber-300"
                      : "border-slate-200"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {a.alert_code}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          a.severity === "Critical"
                            ? "bg-red-100 text-red-700"
                            : a.severity === "High"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {a.severity} Severity
                      </span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                        {a.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <StatusBadge status={a.status} size="sm" />
                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(a.created_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{a.title}</h3>
                    <p className="text-xs text-slate-600 mt-1 whitespace-pre-line leading-relaxed">
                      {a.description}
                    </p>
                  </div>

                  <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <span className="font-semibold text-teal-800 block mb-0.5">Recommended Response:</span>
                    <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                      {a.recommended_action}
                    </p>
                  </div>

                  {a.resolution_notes && (
                    <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                      <span className="font-semibold block mb-0.5">
                        Resolution Notes ({new Date(a.resolved_at!).toLocaleString()}):
                      </span>
                      <p className="leading-relaxed">{a.resolution_notes}</p>
                    </div>
                  )}

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                    <Link
                      to={`/sources/${a.source_id}`}
                      className="text-xs font-semibold text-slate-700 hover:text-teal-600 flex items-center gap-1"
                    >
                      <span>Source: {a.source_name} ({a.source_code})</span>
                    </Link>

                    {user?.role !== "Community Viewer" && a.status !== "Resolved" && (
                      <div className="flex items-center gap-2">
                        {a.status === "Active" && (
                          <button
                            onClick={() => handleAcknowledge(a.id)}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Acknowledge
                          </button>
                        )}
                        <button
                          onClick={() => setResolvingAlert(a)}
                          className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors flex items-center gap-1 shadow-xs"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Resolve & Close
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* Notifications Tab */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-2">
            Dispatched Event Log (In-App & Simulated Gateways)
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Audit trail of automated notifications dispatched when screening thresholds are triggered.
          </p>

          <div className="space-y-3">
            {notifications.map((n) => (
              <div
                key={n.id}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{n.title}</span>
                    <span className="text-[10px] font-mono bg-teal-100 text-teal-800 px-2 py-0.2 rounded font-semibold">
                      {n.channel}
                    </span>
                  </div>
                  <p className="text-slate-600 mt-1">{n.message}</p>
                </div>

                <div className="text-right shrink-0 text-[11px] text-slate-400">
                  <span className="block font-medium text-teal-700">{n.delivery_status}</span>
                  <span>{new Date(n.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resolve Alert Modal */}
      <Modal
        isOpen={!!resolvingAlert}
        onClose={() => setResolvingAlert(null)}
        title={`Resolve Alert: ${resolvingAlert?.alert_code}`}
        maxWidth="md"
      >
        <form onSubmit={handleResolve} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Corrective Action & Resolution Notes *
            </label>
            <p className="text-[11px] text-slate-400 mb-2">
              Explain the sanitary inspection findings, pipe repairs, backwash procedures, or lab results that justify resolving this alert.
            </p>
            <textarea
              required
              rows={4}
              placeholder="e.g. Inspected chlorination dosing mechanism. Replaced corroded valve. Follow-up test confirmed pH returned to 7.20 and turbidity < 0.8 NTU."
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              className="w-full p-2.5 text-xs border rounded-lg focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setResolvingAlert(null)}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-xs"
            >
              {isSubmitting ? "Submitting..." : "Confirm Resolution"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
