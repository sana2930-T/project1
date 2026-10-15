import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Microscope,
  Plus,
  Download,
  CheckCircle,
  AlertTriangle,
  FileText,
  ShieldCheck,
  Search,
  ExternalLink,
  Info
} from "lucide-react";
import { api } from "../services/api";
import { LaboratoryResult, WaterSource } from "../types";
import { StatusBadge } from "../components/StatusBadge";
import { Modal } from "../components/Modal";
import { SkeletonLoader } from "../components/SkeletonLoader";
import { useAuth } from "../context/AuthContext";

export const LaboratoryPage: React.FC = () => {
  const { user } = useAuth();
  const [labResults, setLabResults] = useState<LaboratoryResult[]>([]);
  const [sources, setSources] = useState<WaterSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSourceId, setSelectedSourceId] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState<{
    lab_sample_id: string;
    source_id: number;
    collection_date: string;
    testing_date: string;
    laboratory_name: string;
    accredited_standard: string;
    coliform_bacteria: string;
    e_coli: string;
    heavy_metals_status: string;
    chemical_parameters: string;
    verification_status: "Verified" | "Pending Review" | "Inconclusive";
    reviewer_name: string;
    notes: string;
    report_file_ref: string;
  }>({
    lab_sample_id: "",
    source_id: 0,
    collection_date: new Date().toISOString().split("T")[0],
    testing_date: new Date().toISOString().split("T")[0],
    laboratory_name: "State Public Health & Water Quality Referral Laboratory",
    accredited_standard: "IS 10500:2012",
    coliform_bacteria: "Absent / 100ml",
    e_coli: "Absent / 100ml",
    heavy_metals_status: "Below Quantifiable Limits (Lead < 0.01 mg/L, Arsenic < 0.01 mg/L)",
    chemical_parameters: '{"Fluoride": "0.7 mg/L", "Nitrate": "14.5 mg/L", "Chloride": "92 mg/L", "Total Hardness": "210 mg/L"}',
    verification_status: "Verified",
    reviewer_name: "",
    notes: "",
    report_file_ref: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [labs, srcs] = await Promise.all([
        api.laboratory.getAll({
          source_id: selectedSourceId ? Number(selectedSourceId) : undefined,
        }),
        api.sources.getAll(),
      ]);
      setLabResults(labs);
      setSources(srcs);
      if (srcs.length > 0 && formData.source_id === 0) {
        setFormData((prev) => ({ ...prev, source_id: srcs[0].id }));
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

  const handleCreateLabResult = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.laboratory.create({
        ...formData,
        source_id: Number(formData.source_id),
        collection_date: new Date(formData.collection_date).toISOString(),
        testing_date: new Date(formData.testing_date).toISOString(),
        reviewer_name: formData.reviewer_name || user?.full_name || "Chief Water Chemist",
      });
      setIsModalOpen(false);
      setFormData({
        lab_sample_id: "",
        source_id: sources[0]?.id || 0,
        collection_date: new Date().toISOString().split("T")[0],
        testing_date: new Date().toISOString().split("T")[0],
        laboratory_name: "State Public Health & Water Quality Referral Laboratory",
        accredited_standard: "IS 10500:2012",
        coliform_bacteria: "Absent / 100ml",
        e_coli: "Absent / 100ml",
        heavy_metals_status: "Below Quantifiable Limits (Lead < 0.01 mg/L, Arsenic < 0.01 mg/L)",
        chemical_parameters: '{"Fluoride": "0.7 mg/L", "Nitrate": "14.5 mg/L", "Chloride": "92 mg/L", "Total Hardness": "210 mg/L"}',
        verification_status: "Verified",
        reviewer_name: "",
        notes: "",
        report_file_ref: "",
      });
      fetchData();
    } catch (err: any) {
      alert(`Error logging laboratory test: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Microscope className="w-5 h-5 text-teal-600" />
            Accredited Laboratory Confirmatory Reports
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Certified microbiological and heavy metal test results from NABL / State Public Health Laboratories
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <a
            href={api.reports.getExportUrl("laboratory")}
            download
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Export Lab CSV
          </a>

          {user?.role !== "Community Viewer" && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Log Verified Lab Certificate
            </button>
          )}
        </div>
      </div>

      {/* Critical Scientific Disclaimer Card */}
      <div className="bg-gradient-to-r from-teal-900 to-slate-900 text-white p-5 rounded-2xl shadow-md border border-teal-800">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-6 h-6 text-teal-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1.5 leading-relaxed">
            <h3 className="font-bold text-teal-200 text-sm">
              The Fundamental Boundary: Sensor Screening vs. Confirmatory Laboratory Testing
            </h3>
            <p className="text-slate-300">
              Field multi-parameter probes (pH, Turbidity, TDS, Temp, EC) provide high-frequency surveillance to detect sudden deviations.
              However, <strong>microbiological pathogens (E. coli, Total Coliform, Cryptosporidium) and toxic heavy metals (Arsenic, Lead, Mercury, Cadmium)</strong> can only be conclusively quantified through accredited laboratory culture or atomic absorption spectroscopy.
            </p>
            <p className="text-teal-300 font-medium">
              Only verified laboratory reports recorded in this module can confirm microbiological and chemical potability.
            </p>
          </div>
        </div>
      </div>

      {/* Source Filter */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-4">
        <div className="w-full sm:w-80">
          <select
            value={selectedSourceId}
            onChange={(e) => setSelectedSourceId(e.target.value)}
            className="w-full py-1.5 px-3 text-xs rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500 bg-white"
          >
            <option value="">All Water Sources ({sources.length})</option>
            {sources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.source_code})
              </option>
            ))}
          </select>
        </div>
        <span className="text-xs text-slate-500 font-mono">
          Showing {labResults.length} Verified Certificates
        </span>
      </div>

      {/* Lab Results Cards */}
      {loading ? (
        <SkeletonLoader rows={4} />
      ) : labResults.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500">
          <Microscope className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">No laboratory certificates logged yet</h3>
          <p className="text-xs text-slate-400 mt-1">
            Certified reports from state referral water testing laboratories will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {labResults.map((r) => (
            <div
              key={r.id}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                      Sample ID: {r.lab_sample_id}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-emerald-600" />
                      {r.verification_status}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1">
                    {r.laboratory_name}
                  </h3>
                  <Link
                    to={`/sources/${r.source_id}`}
                    className="text-xs text-teal-600 hover:underline font-semibold"
                  >
                    Source: {r.source_name}
                  </Link>
                </div>

                <div className="text-right text-xs text-slate-500">
                  <span className="block font-medium">Standard: {r.accredited_standard}</span>
                  <span className="text-[11px] text-slate-400">
                    Collected: {new Date(r.collection_date).toLocaleDateString()} &bull; Tested: {new Date(r.testing_date).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Parameters Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <span className="font-semibold text-slate-700 block mb-0.5">Microbiological (Coliform):</span>
                  <span className="font-bold text-emerald-700 font-mono block">{r.coliform_bacteria}</span>
                  <span className="text-[10px] text-slate-400">IS 10500 Limit: 0 / 100ml</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <span className="font-semibold text-slate-700 block mb-0.5">E. Coli Bacterium:</span>
                  <span className="font-bold text-emerald-700 font-mono block">{r.e_coli}</span>
                  <span className="text-[10px] text-slate-400">Must be absent in drinking water</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <span className="font-semibold text-slate-700 block mb-0.5">Heavy Metals Screening:</span>
                  <span className="font-bold text-slate-800 block text-[11px]">{r.heavy_metals_status}</span>
                  <span className="text-[10px] text-slate-400">Arsenic, Lead, Cadmium</span>
                </div>
              </div>

              {/* Chemical Parameters Table */}
              {r.chemical_parameters && (
                <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 text-xs mb-3">
                  <span className="font-semibold text-slate-700 block mb-1">
                    Anion & Mineral Concentration Parameters:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                    {Object.entries(JSON.parse(r.chemical_parameters)).map(([key, val]) => (
                      <div key={key} className="bg-white p-2 rounded-lg border border-slate-200">
                        <span className="text-slate-500 block text-[10px]">{key}</span>
                        <span className="font-bold text-slate-800">{String(val)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {r.notes && (
                <p className="text-xs text-slate-600 bg-teal-50/40 p-2.5 rounded-xl border border-teal-100 italic">
                  &ldquo;{r.notes}&rdquo;
                </p>
              )}

              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Verified by: <strong>{r.reviewer_name}</strong></span>
                {r.report_file_ref && (
                  <span className="font-mono text-teal-600 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    Ref: {r.report_file_ref}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Log Lab Result Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Log Certified Laboratory Water Test Result"
        maxWidth="xl"
      >
        <form onSubmit={handleCreateLabResult} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sample / Certificate ID *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. LAB-MAH-2026-904"
                value={formData.lab_sample_id}
                onChange={(e) => setFormData({ ...formData, lab_sample_id: e.target.value })}
                className="w-full p-2 text-xs border rounded-lg focus:ring-2 focus:ring-teal-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Water Source *
              </label>
              <select
                required
                value={formData.source_id}
                onChange={(e) => setFormData({ ...formData, source_id: Number(e.target.value) })}
                className="w-full p-2 text-xs border rounded-lg focus:ring-2 focus:ring-teal-500 bg-white"
              >
                {sources.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.source_code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sample Collection Date *
              </label>
              <input
                type="date"
                required
                value={formData.collection_date}
                onChange={(e) => setFormData({ ...formData, collection_date: e.target.value })}
                className="w-full p-2 text-xs border rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Laboratory Testing Date *
              </label>
              <input
                type="date"
                required
                value={formData.testing_date}
                onChange={(e) => setFormData({ ...formData, testing_date: e.target.value })}
                className="w-full p-2 text-xs border rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Accredited Standard
              </label>
              <input
                type="text"
                value={formData.accredited_standard}
                onChange={(e) => setFormData({ ...formData, accredited_standard: e.target.value })}
                className="w-full p-2 text-xs border rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Accredited Laboratory Name *
            </label>
            <input
              type="text"
              required
              value={formData.laboratory_name}
              onChange={(e) => setFormData({ ...formData, laboratory_name: e.target.value })}
              className="w-full p-2 text-xs border rounded-lg focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Total Coliform Bacteria Result
              </label>
              <input
                type="text"
                value={formData.coliform_bacteria}
                onChange={(e) => setFormData({ ...formData, coliform_bacteria: e.target.value })}
                className="w-full p-2 text-xs border rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                E. Coli Bacterium Result
              </label>
              <input
                type="text"
                value={formData.e_coli}
                onChange={(e) => setFormData({ ...formData, e_coli: e.target.value })}
                className="w-full p-2 text-xs border rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Heavy Metals Quantification
            </label>
            <input
              type="text"
              value={formData.heavy_metals_status}
              onChange={(e) => setFormData({ ...formData, heavy_metals_status: e.target.value })}
              className="w-full p-2 text-xs border rounded-lg focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Chemical & Mineral Parameters (JSON / Key-Values)
            </label>
            <textarea
              rows={2}
              value={formData.chemical_parameters}
              onChange={(e) => setFormData({ ...formData, chemical_parameters: e.target.value })}
              className="w-full p-2 text-xs border rounded-lg focus:ring-2 focus:ring-teal-500 font-mono"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reviewer / Water Microbiologist Name *
              </label>
              <input
                type="text"
                required
                placeholder="Dr. S. K. Roy (Chief Chemist)"
                value={formData.reviewer_name}
                onChange={(e) => setFormData({ ...formData, reviewer_name: e.target.value })}
                className="w-full p-2 text-xs border rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official Report Document Reference
              </label>
              <input
                type="text"
                placeholder="CERT-NABL-2026-099.pdf"
                value={formData.report_file_ref}
                onChange={(e) => setFormData({ ...formData, report_file_ref: e.target.value })}
                className="w-full p-2 text-xs border rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Laboratory Findings & Certification Notes
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Conforms to microbiological requirements of IS 10500:2012 for potable water."
              className="w-full p-2 text-xs border rounded-lg focus:ring-2 focus:ring-teal-500"
            />
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
              Record Certified Lab Report
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
