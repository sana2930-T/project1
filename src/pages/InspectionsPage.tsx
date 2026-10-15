import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ClipboardCheck,
  Plus,
  Download,
  Filter,
  Search,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  UserCheck,
  Edit,
  ExternalLink
} from "lucide-react";
import { api } from "../services/api";
import { Inspection, WaterSource, InspectionStatus, InspectionPriority } from "../types";
import { StatusBadge } from "../components/StatusBadge";
import { Modal } from "../components/Modal";
import { SkeletonLoader } from "../components/SkeletonLoader";
import { useAuth } from "../context/AuthContext";

export const InspectionsPage: React.FC = () => {
  const { user } = useAuth();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [sources, setSources] = useState<WaterSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  // Create Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState<{
    source_id: number;
    title: string;
    priority: InspectionPriority;
    due_date: string;
    observations: string;
  }>({
    source_id: 0,
    title: "",
    priority: "Medium",
    due_date: "",
    observations: "",
  });

  // Edit / Update Modal
  const [editingInspection, setEditingInspection] = useState<Inspection | null>(null);
  const [editForm, setEditForm] = useState<{
    status: InspectionStatus;
    priority: InspectionPriority;
    observations: string;
    corrective_actions: string;
    notes: string;
    lab_report_ref: string;
    resolution_summary: string;
  }>({
    status: "Open",
    priority: "Medium",
    observations: "",
    corrective_actions: "",
    notes: "",
    lab_report_ref: "",
    resolution_summary: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [inspData, srcData] = await Promise.all([
        api.inspections.getAll({
          status: statusFilter || undefined,
          priority: priorityFilter || undefined,
        }),
        api.sources.getAll(),
      ]);
      setInspections(inspData);
      setSources(srcData);
      if (srcData.length > 0 && createForm.source_id === 0) {
        setCreateForm((prev) => ({ ...prev, source_id: srcData[0].id }));
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, priorityFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.inspections.create({
        ...createForm,
        source_id: Number(createForm.source_id),
      });
      setIsCreateModalOpen(false);
      setCreateForm({
        source_id: sources[0]?.id || 0,
        title: "",
        priority: "Medium",
        due_date: "",
        observations: "",
      });
      fetchData();
    } catch (err: any) {
      alert(`Error creating inspection: ${err.message}`);
    }
  };

  const openEditModal = (insp: Inspection) => {
    setEditingInspection(insp);
    setEditForm({
      status: insp.status,
      priority: insp.priority,
      observations: insp.observations || "",
      corrective_actions: insp.corrective_actions || "",
      notes: insp.notes || "",
      lab_report_ref: insp.lab_report_ref || "",
      resolution_summary: insp.resolution_summary || "",
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInspection) return;
    try {
      await api.inspections.update(editingInspection.id, editForm);
      setEditingInspection(null);
      fetchData();
    } catch (err: any) {
      alert(`Error updating inspection: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-indigo-600" />
            Field Inspection & Corrective Action Workflows
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Assign sanitary surveys, document physical apron repairs, reference laboratory reports, and log closures
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <a
            href={api.reports.getExportUrl("inspections")}
            download
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </a>

          {user?.role !== "Community Viewer" && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New Inspection Task
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-1.5 px-3 text-xs rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500 bg-white"
          >
            <option value="">All Inspection Statuses</option>
            <option value="Open">Open</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Awaiting Laboratory Result">Awaiting Laboratory Result</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>

        <div>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full py-1.5 px-3 text-xs rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500 bg-white"
          >
            <option value="">All Priorities</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Inspections List */}
      {loading ? (
        <SkeletonLoader rows={5} />
      ) : inspections.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500">
          <ClipboardCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">No field inspections found</h3>
          <p className="text-xs text-slate-400 mt-1">Create an inspection task or clear filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {inspections.map((insp) => (
            <div
              key={insp.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {insp.inspection_code}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      insp.priority === "Urgent"
                        ? "bg-red-100 text-red-700"
                        : insp.priority === "High"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {insp.priority} Priority
                  </span>
                  <StatusBadge status={insp.status} size="sm" />
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                    {insp.assigned_officer_name || "Unassigned"}
                  </span>
                  {insp.due_date && (
                    <span className="flex items-center gap-1 font-mono text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Due: {new Date(insp.due_date).toLocaleDateString([], { month: "short", day: "numeric" })}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900">{insp.title}</h3>
                <Link
                  to={`/sources/${insp.source_id}`}
                  className="text-xs text-teal-600 hover:underline font-medium inline-block mt-0.5"
                >
                  Water Source: {insp.source_name}
                </Link>
              </div>

              {insp.observations && (
                <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <span className="font-semibold text-slate-700 block mb-0.5">Field Observations:</span>
                  <p className="text-slate-600 leading-relaxed">{insp.observations}</p>
                </div>
              )}

              {insp.corrective_actions && (
                <div className="mt-2 p-3 rounded-xl bg-teal-50/60 border border-teal-100 text-xs text-teal-900">
                  <span className="font-semibold block mb-0.5">Corrective Actions Executed:</span>
                  <p className="leading-relaxed">{insp.corrective_actions}</p>
                </div>
              )}

              {insp.resolution_summary && (
                <div className="mt-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                  <span className="font-semibold block mb-0.5">
                    Resolution Summary (Closed {new Date(insp.closed_at!).toLocaleDateString()}):
                  </span>
                  <p className="leading-relaxed">{insp.resolution_summary}</p>
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                <span className="text-[11px] text-slate-400">
                  Created {new Date(insp.created_at).toLocaleDateString()}
                </span>

                {user?.role !== "Community Viewer" && (
                  <button
                    onClick={() => openEditModal(insp)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <Edit className="w-3.5 h-3.5 text-teal-600" />
                    Update Progress & Observations
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Inspection Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Field Inspection Task"
        maxWidth="md"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Target Water Source *
            </label>
            <select
              required
              value={createForm.source_id}
              onChange={(e) => setCreateForm({ ...createForm, source_id: Number(e.target.value) })}
              className="w-full p-2 text-xs border rounded-lg focus:ring-2 focus:ring-teal-500 bg-white"
            >
              {sources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.source_code} &bull; {s.locality})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Inspection Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Sanitary Survey & Borewell Casing Inspection"
              value={createForm.title}
              onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
              className="w-full p-2 text-xs border rounded-lg focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Priority
              </label>
              <select
                value={createForm.priority}
                onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value as InspectionPriority })}
                className="w-full p-2 text-xs border rounded-lg focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="Urgent">Urgent</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Due Date
              </label>
              <input
                type="date"
                value={createForm.due_date}
                onChange={(e) => setCreateForm({ ...createForm, due_date: e.target.value })}
                className="w-full p-2 text-xs border rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Initial Instructions & Observations
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Conduct sanitary survey around source apron. Check for stagnant surface pooling within 10 meters."
              value={createForm.observations}
              onChange={(e) => setCreateForm({ ...createForm, observations: e.target.value })}
              className="w-full p-2 text-xs border rounded-lg focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-xs"
            >
              Assign Inspection Task
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit / Update Inspection Modal */}
      <Modal
        isOpen={!!editingInspection}
        onClose={() => setEditingInspection(null)}
        title={`Update Inspection: ${editingInspection?.inspection_code}`}
        maxWidth="lg"
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Task Status *
              </label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value as InspectionStatus })}
                className="w-full p-2 text-xs border rounded-lg focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="Open">Open</option>
                <option value="Assigned">Assigned</option>
                <option value="In Progress">In Progress</option>
                <option value="Awaiting Laboratory Result">Awaiting Laboratory Result</option>
                <option value="Resolved">Resolved</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Priority
              </label>
              <select
                value={editForm.priority}
                onChange={(e) => setEditForm({ ...editForm, priority: e.target.value as InspectionPriority })}
                className="w-full p-2 text-xs border rounded-lg focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="Urgent">Urgent</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Field Observations & Sanitary Survey Notes
            </label>
            <textarea
              rows={3}
              value={editForm.observations}
              onChange={(e) => setEditForm({ ...editForm, observations: e.target.value })}
              className="w-full p-2 text-xs border rounded-lg focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Corrective Actions Executed (Repairs, Disinfection, Flushing)
            </label>
            <textarea
              rows={2}
              value={editForm.corrective_actions}
              onChange={(e) => setEditForm({ ...editForm, corrective_actions: e.target.value })}
              className="w-full p-2 text-xs border rounded-lg focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Laboratory Sample Reference / Certificate ID
            </label>
            <input
              type="text"
              placeholder="e.g. LAB-PUN-2026-4401"
              value={editForm.lab_report_ref}
              onChange={(e) => setEditForm({ ...editForm, lab_report_ref: e.target.value })}
              className="w-full p-2 text-xs border rounded-lg focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {editForm.status === "Resolved" && (
            <div>
              <label className="block text-xs font-semibold text-emerald-800 mb-1">
                Final Resolution Summary (Required for closure)
              </label>
              <textarea
                required
                rows={2}
                placeholder="e.g. Pump repaired, casing sealed with concrete apron, follow-up tests verify normal baseline parameters."
                value={editForm.resolution_summary}
                onChange={(e) => setEditForm({ ...editForm, resolution_summary: e.target.value })}
                className="w-full p-2 text-xs border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-emerald-50/50"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEditingInspection(null)}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-xs"
            >
              Save Inspection Updates
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
