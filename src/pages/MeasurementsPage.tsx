import React, { useState, useEffect } from "react";
import {
  FlaskConical,
  Plus,
  Download,
  Filter,
  Search,
  CheckCircle,
  AlertTriangle,
  Activity,
  Cpu,
  RefreshCw,
  Info
} from "lucide-react";
import { api } from "../services/api";
import { Measurement, WaterSource } from "../types";
import { StatusBadge } from "../components/StatusBadge";
import { Modal } from "../components/Modal";
import { SkeletonLoader } from "../components/SkeletonLoader";
import { useAuth } from "../context/AuthContext";

export const MeasurementsPage: React.FC = () => {
  const { user } = useAuth();
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [sources, setSources] = useState<WaterSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSourceId, setSelectedSourceId] = useState<string>("");
  const [search, setSearch] = useState("");

  // Entry Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewResult, setPreviewResult] = useState<any | null>(null);
  const [evaluating, setEvaluating] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    source_id: 0,
    ph: 7.2,
    turbidity: 0.5,
    temperature: 24.5,
    tds: 250,
    electrical_conductivity: 380,
    measurement_method: "Manual",
    sensor_id: "FIELD-PH-01",
    operator_name: "",
    calibration_info: "Calibrated with pH 7.0 & 4.0 standard buffer",
    notes: "",
    is_simulated: false,
    provenance: "Field Handheld Multiparameter Instrument",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [measData, srcData] = await Promise.all([
        api.measurements.getAll({
          source_id: selectedSourceId ? Number(selectedSourceId) : undefined,
          limit: 100,
        }),
        api.sources.getAll(),
      ]);
      setMeasurements(measData);
      setSources(srcData);
      if (srcData.length > 0 && formData.source_id === 0) {
        setFormData((prev) => ({ ...prev, source_id: srcData[0].id }));
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedSourceId]);

  // Real-time Dry-Run Screening Preview
  const handleDryRunPreview = async () => {
    if (!formData.source_id) return;
    setEvaluating(true);
    try {
      const preview = await api.screenings.evaluate({
        source_id: Number(formData.source_id),
        ph: Number(formData.ph),
        turbidity: Number(formData.turbidity),
        temperature: Number(formData.temperature),
        tds: Number(formData.tds),
        electrical_conductivity: Number(formData.electrical_conductivity),
        measurement_method: formData.measurement_method,
        sensor_id: formData.sensor_id,
        provenance: formData.provenance,
      });
      setPreviewResult(preview);
    } catch (err: any) {
      console.error(err);
    } finally {
      setEvaluating(false);
    }
  };

  const handleCreateMeasurement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.measurements.create({
        ...formData,
        source_id: Number(formData.source_id),
        ph: Number(formData.ph),
        turbidity: Number(formData.turbidity),
        temperature: Number(formData.temperature),
        tds: Number(formData.tds),
        electrical_conductivity: Number(formData.electrical_conductivity),
        operator_name: formData.operator_name || user?.full_name || "Field Agent",
      });
      setIsModalOpen(false);
      setPreviewResult(null);
      fetchData();
    } catch (err: any) {
      alert(`Validation error: ${err.message}`);
    }
  };

  const handleSimulateScenario = async (scenario: string) => {
    const targetId = selectedSourceId ? Number(selectedSourceId) : sources[0]?.id;
    if (!targetId) return;
    try {
      await api.measurements.simulate(targetId, scenario);
      fetchData();
    } catch (err: any) {
      alert(`Simulation error: ${err.message}`);
    }
  };

  const filteredMeasurements = measurements.filter((m) => {
    if (!search) return true;
    const query = search.toLowerCase();
    return (
      m.source_name?.toLowerCase().includes(query) ||
      m.source_code?.toLowerCase().includes(query) ||
      m.notes?.toLowerCase().includes(query) ||
      m.provenance?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-teal-600" />
            Water Quality Surveillance & Measurement Registry
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Record physical-chemical field measurements, run live IS 10500 screenings, and review provenance
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <a
            href={api.reports.getExportUrl("measurements")}
            download
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </a>

          {user?.role !== "Community Viewer" && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Log Field Reading
            </button>
          )}
        </div>
      </div>

      {/* Simulator Quick Action Toolbar */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-teal-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-teal-300">
              Simulated Telemetry Stream Generator
            </h4>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Dispatch simulated sensor measurements directly to any water source for testing and demonstration.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleSimulateScenario("normal")}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
          >
            + Normal Reading
          </button>
          <button
            onClick={() => handleSimulateScenario("high_turbidity_monsoon")}
            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition-colors"
          >
            + Turbidity Surge
          </button>
          <button
            onClick={() => handleSimulateScenario("acidic_industrial")}
            className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-colors"
          >
            + Acidic Alert (Critical)
          </button>
          <button
            onClick={() => handleSimulateScenario("sensor_glitch")}
            className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold transition-colors"
          >
            + Sensor Disconnect Fault
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search measurements by source name, provenance, notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div>
          <select
            value={selectedSourceId}
            onChange={(e) => setSelectedSourceId(e.target.value)}
            className="w-full py-1.5 px-3 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          >
            <option value="">All Water Sources ({sources.length})</option>
            {sources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.source_code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Measurements Table */}
      {loading ? (
        <SkeletonLoader rows={6} />
      ) : filteredMeasurements.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500">
          <FlaskConical className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">No measurements found</h3>
          <p className="text-xs text-slate-400 mt-1">Log a field measurement or generate a simulated reading above.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-3">Water Source</th>
                  <th className="py-3 px-3 font-mono">pH</th>
                  <th className="py-3 px-3 font-mono">Turbidity</th>
                  <th className="py-3 px-3 font-mono">TDS</th>
                  <th className="py-3 px-3 font-mono">Temp</th>
                  <th className="py-3 px-4">Screening Outcome</th>
                  <th className="py-3 px-3">Data Provenance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMeasurements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                      {new Date(m.timestamp).toLocaleDateString([], { month: "short", day: "numeric" })}{" "}
                      <span className="text-slate-400">
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="font-bold text-slate-900 block truncate max-w-[170px]">
                        {m.source_name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {m.source_code}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-mono font-medium">
                      <span className={m.ph && (m.ph < 6.5 || m.ph > 8.5) ? "text-red-600 font-bold" : "text-slate-800"}>
                        {m.ph ? m.ph.toFixed(2) : "-"}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-mono font-medium">
                      <span className={m.turbidity && m.turbidity > 1.0 ? "text-amber-600 font-bold" : "text-slate-800"}>
                        {m.turbidity ? `${m.turbidity.toFixed(1)} NTU` : "-"}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-mono font-medium">
                      <span className={m.tds && m.tds > 500 ? "text-amber-600 font-bold" : "text-slate-800"}>
                        {m.tds ? `${m.tds.toFixed(0)} mg/L` : "-"}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-mono text-slate-600">
                      {m.temperature ? `${m.temperature.toFixed(1)}°C` : "-"}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={m.screening_status} size="sm" />
                    </td>
                    <td className="py-3.5 px-3 text-[11px] text-slate-500">
                      <span className="block truncate max-w-[150px]">{m.provenance}</span>
                      {m.is_simulated && (
                        <span className="inline-block text-[9px] bg-cyan-100 text-cyan-800 px-1.5 py-0.2 rounded font-medium mt-0.5">
                          Simulated
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Log Field Reading Modal with Live Dry-Run Preview */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Log Water Quality Field Reading"
        maxWidth="xl"
      >
        <form onSubmit={handleCreateMeasurement} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Water Source *
            </label>
            <select
              required
              value={formData.source_id}
              onChange={(e) => setFormData({ ...formData, source_id: Number(e.target.value) })}
              className="w-full p-2 text-xs border rounded-lg focus:ring-2 focus:ring-teal-500 bg-white"
            >
              {sources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.source_code} &bull; {s.locality})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                pH Value (0 - 14) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="14"
                required
                value={formData.ph}
                onChange={(e) => setFormData({ ...formData, ph: Number(e.target.value) })}
                className="w-full p-2 text-xs border rounded-lg focus:ring-2 focus:ring-teal-500 font-mono"
              />
              <span className="text-[10px] text-slate-400">Acceptable: 6.5 - 8.5</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Turbidity (NTU) *
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                required
                value={formData.turbidity}
                onChange={(e) => setFormData({ ...formData, turbidity: Number(e.target.value) })}
                className="w-full p-2 text-xs border rounded-lg focus:ring-2 focus:ring-teal-500 font-mono"
              />
              <span className="text-[10px] text-slate-400">Desirable: &lt; 1.0 NTU</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                TDS (mg/L) *
              </label>
              <input
                type="number"
                step="1"
                min="0"
                required
                value={formData.tds}
                onChange={(e) => setFormData({ ...formData, tds: Number(e.target.value) })}
                className="w-full p-2 text-xs border rounded-lg focus:ring-2 focus:ring-teal-500 font-mono"
              />
              <span className="text-[10px] text-slate-400">Desirable: &lt; 500 mg/L</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Temperature (&deg;C)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.temperature}
                onChange={(e) => setFormData({ ...formData, temperature: Number(e.target.value) })}
                className="w-full p-2 text-xs border rounded-lg focus:ring-2 focus:ring-teal-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Electrical Conductivity (&micro;S/cm)
              </label>
              <input
                type="number"
                step="1"
                value={formData.electrical_conductivity}
                onChange={(e) => setFormData({ ...formData, electrical_conductivity: Number(e.target.value) })}
                className="w-full p-2 text-xs border rounded-lg focus:ring-2 focus:ring-teal-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Measurement Method
              </label>
              <select
                value={formData.measurement_method}
                onChange={(e) => setFormData({ ...formData, measurement_method: e.target.value })}
                className="w-full p-2 text-xs border rounded-lg focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="Manual">Manual Handheld</option>
                <option value="Simulated Sensor">Simulated Sensor</option>
                <option value="IoT Device">IoT Online Probe</option>
                <option value="Laboratory Verification">Laboratory Verification</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sensor ID / Probe Code
              </label>
              <input
                type="text"
                value={formData.sensor_id}
                onChange={(e) => setFormData({ ...formData, sensor_id: e.target.value })}
                className="w-full p-2 text-xs border rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Operator / Field Agent
              </label>
              <input
                type="text"
                placeholder={user?.full_name || "Field Agent"}
                value={formData.operator_name}
                onChange={(e) => setFormData({ ...formData, operator_name: e.target.value })}
                className="w-full p-2 text-xs border rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Calibration Info & Observations
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Clear flow, water running without odor. Sample collected at wellhead."
              className="w-full p-2 text-xs border rounded-lg focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Live Dry-Run Screening Preview Button & Result */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-teal-600" />
                Live Pre-Save Screening Evaluation
              </span>
              <button
                type="button"
                onClick={handleDryRunPreview}
                disabled={evaluating}
                className="px-2.5 py-1 rounded-md bg-slate-200 hover:bg-slate-300 text-slate-800 text-[11px] font-semibold transition-colors"
              >
                {evaluating ? "Evaluating..." : "Evaluate Parameters"}
              </button>
            </div>

            {previewResult && (
              <div className="mt-2 pt-2 border-t border-slate-200 text-xs animate-fadeIn">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-slate-800">Preview Status:</span>
                  <StatusBadge status={previewResult.status} size="sm" />
                </div>
                <p className="text-slate-600 text-[11px]">{previewResult.explanation}</p>
                {previewResult.triggering_parameters_list?.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {previewResult.triggering_parameters_list.map((t: string, i: number) => (
                      <span key={i} className="bg-amber-100 text-amber-900 text-[10px] px-2 py-0.5 rounded">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-xs"
            >
              Save & Screen Measurement
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
