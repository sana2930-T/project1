import React, { useState } from "react";
import { ShieldAlert, Info, ChevronDown, ChevronUp } from "lucide-react";

export const SafetyDisclaimerBanner: React.FC = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-amber-50/90 border border-amber-300 rounded-xl p-3.5 shadow-xs mb-6 text-amber-950">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
              Official Water Screening Protocol & Safety Notice
              <span className="text-[10px] bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full font-mono">
                IS 10500:2012
              </span>
            </h4>
            <p className="text-xs text-amber-800 mt-0.5 font-normal">
              <strong>Preliminary Screening Only:</strong> Sensor-based assessments (pH, Turbidity, TDS, Temp) flag anomalies but 
              <strong> CANNOT detect biological pathogens (E. coli, Cholera), pesticides, or heavy metals</strong>.
              Sensor results never declare water safe for consumption without accredited laboratory test verification.
            </p>
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-amber-800 hover:text-amber-950 flex items-center gap-1 shrink-0 font-medium bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-md transition-colors"
        >
          {expanded ? "Less Info" : "Standards & Guidelines"}
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-amber-200/80 text-xs grid grid-cols-1 md:grid-cols-3 gap-3 text-amber-900 animate-fadeIn">
          <div className="bg-white/80 p-2.5 rounded-lg border border-amber-200">
            <span className="font-semibold block text-teal-800 mb-1">1. Bureau of Indian Standards (BIS)</span>
            Screenings adhere strictly to <strong>IS 10500:2012</strong> (Second Revision) acceptable limits: pH (6.5–8.5), Turbidity (&lt;1 NTU), TDS (&lt;500 mg/L).
          </div>
          <div className="bg-white/80 p-2.5 rounded-lg border border-amber-200">
            <span className="font-semibold block text-indigo-800 mb-1">2. AI & Anomaly Detection</span>
            Unsupervised Isolation Forest isolates multi-parameter deviation spikes from historical baselines when &ge;5 samples exist.
          </div>
          <div className="bg-white/80 p-2.5 rounded-lg border border-amber-200">
            <span className="font-semibold block text-red-800 mb-1">3. Confirmatory Action Protocol</span>
            Any critical screening status mandates immediate field officer sanitary survey, advisory notices, and laboratory testing.
          </div>
        </div>
      )}
    </div>
  );
};
