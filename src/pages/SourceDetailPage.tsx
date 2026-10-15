import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  MapPin,
  ArrowLeft,
  Calendar,
  FlaskConical,
  AlertTriangle,
  ClipboardCheck,
  ShieldAlert,
  Activity,
  CheckCircle,
  Clock,
  Compass,
  PlusCircle,
  ExternalLink
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from "recharts";
import { api } from "../services/api";
import { WaterSource, Measurement, ScreeningResult, Alert, Inspection } from "../types";
import { StatusBadge } from "../components/StatusBadge";
import { SkeletonLoader } from "../components/SkeletonLoader";

export const SourceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const sourceId = Number(id);

  const [source, setSource] = useState<WaterSource | null>(null);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [screenings, setScreenings] = useState<ScreeningResult[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);

  const fetchSourceDetails = async () => {
    try {
      setLoading(true);
      const [src, meas, scr, alts, insps] = await Promise.all([
        api.sources.getById(sourceId),
        api.sources.getMeasurements(sourceId),
        api.sources.getScreenings(sourceId),
        api.alerts.getAll({ source_id: sourceId }),
        api.inspections.getAll({ source_id: sourceId }),
      ]);
      setSource(src);
      setMeasurements(meas);
      setScreenings(scr);
      setAlerts(alts);
      setInspections(insps);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sourceId) {
      fetchSourceDetails();
    }
  }, [sourceId]);

  const handleSimulate = async (scenario: string) => {
    setSimulating(true);
    try {
      await api.measurements.simulate(sourceId, scenario);
      await fetchSourceDetails();
    } catch (err: any) {
      alert(`Simulation failed: ${err.message}`);
    } finally {
      setSimulating(false);
    }
  };

  if (loading) return <SkeletonLoader rows={6} />;

  if (!source) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <h3 className="font-bold text-slate-800">Water source not found</h3>
        <Link to="/sources" className="mt-3 inline-block text-xs font-semibold text-teal-600">
          &larr; Back to Water Sources
        </Link>
      </div>
    );
  }

  const latestMeas = measurements[0];
  const latestScreening = screenings[0];

  // Chart data
  const chartData = measurements
    .slice(0, 15)
    .reverse()
    .map((m) => ({
      date: new Date(m.timestamp).toLocaleDateString([], { month: "short", day: "numeric" }),
      ph: m.ph,
      turbidity: m.turbidity,
      tds: m.tds,
      temperature: m.temperature,
    }));

  return (
    <div className="space-y-6">
      {/* Back button and Header */}
      <div>
        <Link
          to="/sources"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-teal-600 mb-3 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Water Sources Directory
        </Link>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-md">
                {source.source_code}
              </span>
              <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md font-medium">
                {source.source_type}
              </span>
              <StatusBadge status={source.latest_screening_status} size="sm" />
            </div>

            <h1 className="text-2xl font-bold text-slate-900 mt-2">{source.name}</h1>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {source.locality}, {source.district}, {source.state} &bull; Coordinates: {source.latitude.toFixed(4)}&deg;N, {source.longitude.toFixed(4)}&deg;E
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleSimulate("high_turbidity_monsoon")}
              disabled={simulating}
              className="px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-800 text-xs font-semibold hover:bg-amber-100 transition-colors shadow-xs"
            >
              Simulate Runoff Surge
            </button>
            <button
              onClick={() => handleSimulate("acidic_industrial")}
              disabled={simulating}
              className="px-3 py-1.5 rounded-xl border border-red-300 bg-red-50 text-red-800 text-xs font-semibold hover:bg-red-100 transition-colors shadow-xs"
            >
              Simulate Acidic Risk
            </button>
            <Link
              to="/measurements"
              className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Log Manual Reading
            </Link>
          </div>
        </div>
      </div>

      {/* Latest Measurement Parameters Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 sm:gap-4">
        {/* pH */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium block">pH Level</span>
          <span className={`text-2xl font-bold mt-1 block font-mono ${
            latestMeas?.ph && (latestMeas.ph < 6.5 || latestMeas.ph > 8.5) ? "text-red-600" : "text-slate-900"
          }`}>
            {latestMeas?.ph ? latestMeas.ph.toFixed(2) : "-"}
          </span>
          <span className="text-[10px] text-slate-400 block mt-1">
            IS 10500: 6.5 - 8.5
          </span>
        </div>

        {/* Turbidity */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium block">Turbidity (NTU)</span>
          <span className={`text-2xl font-bold mt-1 block font-mono ${
            latestMeas?.turbidity && latestMeas.turbidity > 1.0 ? "text-amber-600" : "text-slate-900"
          }`}>
            {latestMeas?.turbidity ? `${latestMeas.turbidity.toFixed(1)}` : "-"}
          </span>
          <span className="text-[10px] text-slate-400 block mt-1">
            Desirable &lt; 1.0 NTU
          </span>
        </div>

        {/* TDS */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium block">TDS (mg/L)</span>
          <span className={`text-2xl font-bold mt-1 block font-mono ${
            latestMeas?.tds && latestMeas.tds > 500 ? "text-amber-600" : "text-slate-900"
          }`}>
            {latestMeas?.tds ? `${latestMeas.tds.toFixed(0)}` : "-"}
          </span>
          <span className="text-[10px] text-slate-400 block mt-1">
            Desirable &lt; 500 mg/L
          </span>
        </div>

        {/* Temperature */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium block">Water Temp</span>
          <span className="text-2xl font-bold mt-1 block font-mono text-slate-900">
            {latestMeas?.temperature ? `${latestMeas.temperature.toFixed(1)}°C` : "-"}
          </span>
          <span className="text-[10px] text-slate-400 block mt-1">
            Normal: 10 - 38°C
          </span>
        </div>

        {/* Electrical Conductivity */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 font-medium block">Conductivity (EC)</span>
          <span className="text-2xl font-bold mt-1 block font-mono text-slate-900">
            {latestMeas?.electrical_conductivity ? `${latestMeas.electrical_conductivity.toFixed(0)}` : "-"}
          </span>
          <span className="text-[10px] text-slate-400 block mt-1">
            Unit: &micro;S/cm
          </span>
        </div>
      </div>

      {/* Latest AI Screening Evaluation Dossier */}
      {latestScreening && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-600 block mb-1">
                Latest Screening Assessment
              </span>
              <h3 className="text-base font-bold text-slate-900">
                {latestScreening.status}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluated: {new Date(latestScreening.timestamp).toLocaleString()} &bull; Method: {latestScreening.model_method}
              </p>
            </div>
            <StatusBadge status={latestScreening.status} size="lg" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-3">
              <div>
                <span className="font-semibold text-slate-700 block">Explanation of Finding:</span>
                <p className="text-slate-600 mt-1 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {latestScreening.explanation}
                </p>
              </div>

              {latestScreening.triggering_parameters && (
                <div>
                  <span className="font-semibold text-slate-700 block">Triggering Conditions:</span>
                  <div className="mt-1 space-y-1">
                    {JSON.parse(latestScreening.triggering_parameters).map((trig: string, i: number) => (
                      <span
                        key={i}
                        className="inline-block bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-md text-[11px] mr-1.5 mb-1"
                      >
                        {trig}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <span className="font-semibold text-slate-700 block">Recommended Action Protocol:</span>
                <div className="text-slate-600 mt-1 leading-relaxed bg-teal-50/50 p-3 rounded-xl border border-teal-100 whitespace-pre-line">
                  {latestScreening.recommended_action}
                </div>
              </div>

              <div>
                <span className="font-semibold text-slate-700 block">Standards Evaluated:</span>
                <span className="text-[11px] text-slate-500 font-mono block mt-1">
                  {latestScreening.rules_evaluated}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Historical Trend Chart for this Source */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-teal-600" />
          Source Parameter History
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Time-series of pH, Turbidity, and TDS measurements for {source.name}
        </p>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#64748b" }} />
              <YAxis yAxisId="ph" domain={[5, 10]} tick={{ fontSize: 10, fill: "#64748b" }} />
              <YAxis yAxisId="turb" orientation="right" domain={[0, 15]} tick={{ fontSize: 10, fill: "#64748b" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  color: "#f8fafc",
                  borderRadius: "0.5rem",
                  fontSize: "11px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
              <Line
                yAxisId="ph"
                type="monotone"
                dataKey="ph"
                name="pH (6.5 - 8.5 limit)"
                stroke="#0d9488"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                yAxisId="turb"
                type="monotone"
                dataKey="turbidity"
                name="Turbidity NTU"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Associated Alerts & Inspections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Source Alerts */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Source Alert History ({alerts.length})
            </span>
            <Link to="/alerts" className="text-xs text-teal-600 font-semibold hover:underline">
              Alert Center &rarr;
            </Link>
          </h3>

          <div className="space-y-2.5 max-h-60 overflow-y-auto">
            {alerts.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No alerts logged for this water source.</p>
            ) : (
              alerts.map((a) => (
                <div key={a.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-900">{a.title}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      a.status === "Active" ? "bg-red-100 text-red-700" : "bg-teal-100 text-teal-700"
                    }`}>
                      {a.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">{a.description}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Source Inspections */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ClipboardCheck className="w-4 h-4 text-indigo-600" />
              Field Inspections ({inspections.length})
            </span>
            <Link to="/inspections" className="text-xs text-teal-600 font-semibold hover:underline">
              All Tasks &rarr;
            </Link>
          </h3>

          <div className="space-y-2.5 max-h-60 overflow-y-auto">
            {inspections.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No field inspection tasks recorded.</p>
            ) : (
              inspections.map((insp) => (
                <div key={insp.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-900">{insp.title}</span>
                    <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full">
                      {insp.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">{insp.observations || "Inspection assigned to field officer."}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
