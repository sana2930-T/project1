import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  Plus,
  Search,
  Filter,
  Download,
  AlertCircle,
  CheckCircle,
  FlaskConical,
  ExternalLink,
  Archive,
  RefreshCw
} from "lucide-react";
import { api } from "../services/api";
import { WaterSource, SourceType } from "../types";
import { StatusBadge } from "../components/StatusBadge";
import { Modal } from "../components/Modal";
import { SkeletonLoader } from "../components/SkeletonLoader";
import { useAuth } from "../context/AuthContext";

export const SourcesPage: React.FC = () => {
  const { user } = useAuth();
  const [sources, setSources] = useState<WaterSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSimulating, setIsSimulating] = useState<number | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    source_code: string;
    name: string;
    source_type: import("../types").SourceType;
    locality: string;
    district: string;
    state: string;
    latitude: number;
    longitude: number;
    description: string;
  }>({
    source_code: "",
    name: "",
    source_type: "Borewell",
    locality: "",
    district: "",
    state: "Maharashtra",
    latitude: 18.5204,
    longitude: 73.8567,
    description: "",
  });

  const fetchSources = async () => {
    try {
      setLoading(true);
      const data = await api.sources.getAll({
        search: search || undefined,
        source_type: selectedType || undefined,
        screening_status: selectedStatus || undefined,
      });
      setSources(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, [search, selectedType, selectedStatus]);

  const handleCreateSource = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.sources.create({
        ...formData,
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
      });
      setIsAddModalOpen(false);
      setFormData({
        source_code: "",
        name: "",
        source_type: "Borewell",
        locality: "",
        district: "",
        state: "Maharashtra",
        latitude: 18.5204,
        longitude: 73.8567,
        description: "",
      });
      fetchSources();
    } catch (err: any) {
      alert(`Error creating water source: ${err.message}`);
    }
  };

  const handleQuickSimulate = async (sourceId: number) => {
    setIsSimulating(sourceId);
    try {
      await api.measurements.simulate(sourceId, "normal");
      await fetchSources();
    } catch (err: any) {
      alert(`Simulation error: ${err.message}`);
    } finally {
      setIsSimulating(null);
    }
  };

  const handleArchive = async (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to deactivate and archive "${name}"? Historical measurements will be preserved.`)) {
      try {
        await api.sources.archive(id);
        fetchSources();
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <MapPin className="w-5 h-5 text-teal-600" />
            Water-Source Inventory & Asset Registry
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage monitored borewells, public taps, storage reservoirs, and community handpumps
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <a
            href={api.reports.getExportUrl("sources")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
            download
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </a>

          {user?.role !== "Community Viewer" && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Register Water Source
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, code, or locality..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full py-1.5 px-3 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          >
            <option value="">All Source Types</option>
            <option value="Borewell">Borewell</option>
            <option value="Hand Pump">Hand Pump</option>
            <option value="Public Tap">Public Tap</option>
            <option value="Storage Tank">Storage Tank</option>
            <option value="Pipeline">Pipeline</option>
          </select>
        </div>

        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full py-1.5 px-3 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          >
            <option value="">All Screening Statuses</option>
            <option value="Within Desirable Thresholds (Preliminary)">Within Desirable Limits</option>
            <option value="Threshold Exceeded - Additional Testing Recommended">Threshold Exceeded</option>
            <option value="Urgent Investigation Recommended">Urgent Investigation</option>
            <option value="Unusual Pattern Detected">Unusual Pattern</option>
            <option value="Stale / Insufficient Data">Stale / No Data</option>
          </select>
        </div>
      </div>

      {/* Water Sources Table / Cards */}
      {loading ? (
        <SkeletonLoader rows={5} />
      ) : sources.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500">
          <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">No matching water sources found</h3>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your search criteria or register a new source.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                  <th className="py-3 px-4">Source Code & Name</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Location</th>
                  <th className="py-3 px-3">Coordinates</th>
                  <th className="py-3 px-4">Latest Screening</th>
                  <th className="py-3 px-3 text-center">Active Alerts</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sources.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <Link
                        to={`/sources/${s.id}`}
                        className="font-bold text-slate-900 hover:text-teal-600 flex items-center gap-1.5"
                      >
                        {s.name}
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </Link>
                      <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                        {s.source_code}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                        {s.source_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="text-slate-800 font-medium block">{s.locality}</span>
                      <span className="text-[11px] text-slate-400">{s.district}, {s.state}</span>
                    </td>
                    <td className="py-3.5 px-3 font-mono text-[11px] text-slate-500">
                      {s.latitude.toFixed(4)}, {s.longitude.toFixed(4)}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={s.latest_screening_status} size="sm" />
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      {s.active_alerts_count > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold text-[10px]">
                          <AlertCircle className="w-3 h-3" />
                          {s.active_alerts_count} Active
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">None</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleQuickSimulate(s.id)}
                          disabled={isSimulating === s.id}
                          className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 text-[11px] font-semibold transition-colors flex items-center gap-1"
                          title="Generate Simulated Sensor Reading"
                        >
                          <FlaskConical className={`w-3 h-3 ${isSimulating === s.id ? "animate-spin" : ""}`} />
                          Simulate
                        </button>

                        <Link
                          to={`/sources/${s.id}`}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-[11px] font-medium transition-colors"
                        >
                          View
                        </Link>

                        {user?.role === "Admin" && s.is_active && (
                          <button
                            onClick={() => handleArchive(s.id, s.name)}
                            className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Deactivate and archive source"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Water Source Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register New Monitored Water Source"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateSource} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Source Code *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. JAL-MAH-009"
                value={formData.source_code}
                onChange={(e) => setFormData({ ...formData, source_code: e.target.value })}
                className="w-full p-2 text-xs border rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Source Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sector 5 Primary Tubewell"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2 text-xs border rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Source Type *
              </label>
              <select
                value={formData.source_type}
                onChange={(e) => setFormData({ ...formData, source_type: e.target.value as import("../types").SourceType })}
                className="w-full p-2 text-xs border rounded-lg focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="Borewell">Borewell</option>
                <option value="Hand Pump">Hand Pump</option>
                <option value="Public Tap">Public Tap</option>
                <option value="Storage Tank">Storage Tank</option>
                <option value="Pipeline">Pipeline</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Locality / Ward *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Gandhi Nagar Market"
                value={formData.locality}
                onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                className="w-full p-2 text-xs border rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                District *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Pune"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="w-full p-2 text-xs border rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                State *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Maharashtra"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full p-2 text-xs border rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Latitude (&deg;N) *
              </label>
              <input
                type="number"
                step="any"
                required
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: Number(e.target.value) })}
                className="w-full p-2 text-xs border rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Longitude (&deg;E) *
              </label>
              <input
                type="number"
                step="any"
                required
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: Number(e.target.value) })}
                className="w-full p-2 text-xs border rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description & Infrastructure Notes
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Depth 180 ft, submersible motor 5HP, serves municipal ward 12."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-2 text-xs border rounded-lg focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-xs"
            >
              Save Water Source
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
