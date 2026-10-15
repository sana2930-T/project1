import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import L from "leaflet";
import {
  Map as MapIcon,
  Filter,
  Search,
  MapPin,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Clock,
  Layers,
  List,
  Sparkles
} from "lucide-react";
import { api } from "../services/api";
import { WaterSource } from "../types";
import { StatusBadge } from "../components/StatusBadge";
import { SkeletonLoader } from "../components/SkeletonLoader";

export const MapPage: React.FC = () => {
  const [sources, setSources] = useState<WaterSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSource, setSelectedSource] = useState<WaterSource | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [viewMode, setViewMode] = useState<"split" | "map" | "list">("split");

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: number]: L.Marker }>({});

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await api.sources.getAll();
        setSources(data);
        if (data.length > 0) {
          setSelectedSource(data[0]);
        }
      } catch (err: any) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Filter sources
  const filteredSources = sources.filter((s) => {
    const matchesSearch =
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.source_code.toLowerCase().includes(search.toLowerCase()) ||
      s.locality.toLowerCase().includes(search.toLowerCase());

    const matchesType = !filterType || s.source_type === filterType;
    const matchesStatus = !filterStatus || s.latest_screening_status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  // Initialize Leaflet Map
  useEffect(() => {
    if (viewMode === "list") return;
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Default center around central India (20.5937, 78.9629)
      const map = L.map(mapContainerRef.current, {
        center: [20.5937, 78.9629],
        zoom: 5,
        attributionControl: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear old markers
    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    // Helper for marker colors
    const getMarkerColor = (status?: string) => {
      if (!status) return "#64748b";
      const s = status.toLowerCase();
      if (s.includes("desirable") || s.includes("compliant")) return "#10b981"; // green
      if (s.includes("urgent") || s.includes("critical")) return "#ef4444"; // red
      if (s.includes("threshold exceeded") || s.includes("warning")) return "#f59e0b"; // amber
      if (s.includes("unusual")) return "#6366f1"; // indigo
      return "#94a3b8"; // gray for stale
    };

    filteredSources.forEach((source) => {
      const color = getMarkerColor(source.latest_screening_status);
      const customIcon = L.divIcon({
        className: "custom-leaflet-marker",
        html: `
          <div style="
            background-color: ${color};
            width: 26px;
            height: 26px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
          ">
            <div style="width: 8px; height: 8px; border-radius: 50%; background-color: white;"></div>
          </div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });

      const marker = L.marker([source.latitude, source.longitude], { icon: customIcon })
        .addTo(map)
        .on("click", () => {
          setSelectedSource(source);
        });

      markersRef.current[source.id] = marker;
    });

    // Fit bounds if we have sources
    if (filteredSources.length > 0) {
      const group = L.featureGroup(Object.values(markersRef.current));
      map.fitBounds(group.getBounds().pad(0.15));
    }
  }, [filteredSources, viewMode]);

  const handleSelectSource = (s: WaterSource) => {
    setSelectedSource(s);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([s.latitude, s.longitude], 12, { duration: 1 });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <MapIcon className="w-5 h-5 text-teal-600" />
            Interactive Geospatial Water-Risk Map
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Geographic visualization of water points, color-coded screening status, and synchronized list fallback
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setViewMode("split")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              viewMode === "split"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Split View
          </button>
          <button
            onClick={() => setViewMode("map")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              viewMode === "map"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Map Only
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              viewMode === "list"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            List Fallback
          </button>
        </div>
      </div>

      {/* Filter and Legend Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder="Search map sources..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="py-1.5 px-3 text-xs rounded-lg border border-slate-200 bg-white"
          >
            <option value="">All Types</option>
            <option value="Borewell">Borewells</option>
            <option value="Hand Pump">Hand Pumps</option>
            <option value="Public Tap">Public Taps</option>
            <option value="Storage Tank">Storage Tanks</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="py-1.5 px-3 text-xs rounded-lg border border-slate-200 bg-white"
          >
            <option value="">All Statuses</option>
            <option value="Within Desirable Thresholds (Preliminary)">Compliant</option>
            <option value="Threshold Exceeded - Additional Testing Recommended">Exceeded</option>
            <option value="Urgent Investigation Recommended">Urgent</option>
            <option value="Stale / Insufficient Data">Stale</option>
          </select>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] font-medium text-slate-600 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Compliant
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Exceeded
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" /> Urgent / Critical
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Unusual Pattern
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> Stale (&gt;7d)
          </span>
        </div>
      </div>

      {/* Main Map & Synchronized List Container */}
      {loading ? (
        <SkeletonLoader rows={6} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Leaflet Map Card */}
          {viewMode !== "list" && (
            <div
              className={`${
                viewMode === "split" ? "lg:col-span-8" : "lg:col-span-12"
              } bg-white rounded-2xl border border-slate-200 p-2 shadow-xs`}
            >
              <div
                ref={mapContainerRef}
                className="w-full h-[520px] rounded-xl overflow-hidden shadow-inner"
              />
            </div>
          )}

          {/* Synchronized Side List & Detail Panel */}
          {viewMode !== "map" && (
            <div
              className={`${
                viewMode === "split" ? "lg:col-span-4" : "lg:col-span-12"
              } space-y-4`}
            >
              {/* Selected Source Quick Dossier */}
              {selectedSource && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                        {selectedSource.source_code}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 mt-1">
                        {selectedSource.name}
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        {selectedSource.locality}, {selectedSource.district}
                      </p>
                    </div>
                    <StatusBadge status={selectedSource.latest_screening_status} size="sm" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-400 block">pH Reading</span>
                      <span className="font-bold text-slate-800 font-mono">
                        {selectedSource.latest_measurement?.ph?.toFixed(2) ?? "-"}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-400 block">Turbidity (NTU)</span>
                      <span className="font-bold text-slate-800 font-mono">
                        {selectedSource.latest_measurement?.turbidity?.toFixed(1) ?? "-"}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      GPS: {selectedSource.latitude.toFixed(3)}, {selectedSource.longitude.toFixed(3)}
                    </span>
                    <Link
                      to={`/sources/${selectedSource.id}`}
                      className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
                    >
                      Full Details &rarr;
                    </Link>
                  </div>
                </div>
              )}

              {/* Synchronized Sources List */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Synchronized Sources ({filteredSources.length})
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">Offline-ready</span>
                </div>

                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {filteredSources.map((s) => {
                    const isSelected = selectedSource?.id === s.id;
                    return (
                      <div
                        key={s.id}
                        onClick={() => handleSelectSource(s)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? "bg-teal-50/80 border-teal-300 shadow-xs"
                            : "bg-slate-50/70 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-bold text-slate-900 block truncate">
                            {s.name}
                          </span>
                          <span className="text-[10px] text-slate-500 shrink-0">
                            {s.source_type}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center justify-between">
                          <span className="text-[11px] text-slate-500 font-mono">
                            {s.locality}
                          </span>
                          <StatusBadge status={s.latest_screening_status} size="sm" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
