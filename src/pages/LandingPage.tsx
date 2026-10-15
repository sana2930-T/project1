import React from "react";
import { Link } from "react-router-dom";
import {
  Droplets,
  ShieldCheck,
  Activity,
  AlertTriangle,
  Microscope,
  MapPin,
  ArrowRight,
  Database,
  Cpu,
  CheckCircle,
  FileText,
  Users,
  Compass
} from "lucide-react";

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-slate-950">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Droplets className="w-6 h-6 text-slate-950 fill-slate-950" />
            </div>
            <div>
              <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white via-cyan-100 to-teal-300 bg-clip-text text-transparent">
                JalRakshak AI
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-mono bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded-full">
                Build To Ship 2026
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-teal-500 hover:bg-teal-400 text-slate-950 transition-all flex items-center gap-2 shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 transform hover:-translate-y-0.5"
            >
              <span>Open Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-900/90 via-slate-950 to-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-900/20 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold uppercase tracking-wider mb-6">
            <ShieldCheck className="w-4 h-4" />
            AI-Assisted Drinking Water Surveillance Platform
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
            Smarter Water Monitoring. <br />
            <span className="bg-gradient-to-r from-cyan-300 via-teal-300 to-emerald-300 bg-clip-text text-transparent">
              Earlier Warnings. Healthier Communities.
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            An intelligent, responsible water-monitoring platform for tracking borewells, hand pumps, and piped networks.
            Screening physical and chemical readings against Indian Standards (IS 10500:2012) and multivariate anomaly detection to empower public health teams before contamination spreads.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/dashboard"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-300 hover:to-cyan-300 shadow-xl shadow-teal-500/20 transition-all flex items-center justify-center gap-2 text-sm transform hover:-translate-y-0.5"
            >
              <span>Explore Live Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/map"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-semibold text-slate-200 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 transition-all flex items-center justify-center gap-2 text-sm"
            >
              <MapPin className="w-4 h-4 text-teal-400" />
              <span>Interactive Risk Map</span>
            </Link>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-14 pt-8 border-t border-slate-800/80 grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-xs text-slate-400 block font-medium">Regulatory Standard</span>
              <span className="text-lg font-bold text-teal-300 mt-1 block">IS 10500:2012</span>
              <span className="text-[11px] text-slate-500">BIS Second Revision</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-xs text-slate-400 block font-medium">Anomaly Engine</span>
              <span className="text-lg font-bold text-cyan-300 mt-1 block">Isolation Forest</span>
              <span className="text-[11px] text-slate-500">Multivariate Outliers</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-xs text-slate-400 block font-medium">Early Warning Speed</span>
              <span className="text-lg font-bold text-emerald-300 mt-1 block">&lt; 100 ms</span>
              <span className="text-[11px] text-slate-500">Automated Alert Dispatch</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-xs text-slate-400 block font-medium">Safety Integrity</span>
              <span className="text-lg font-bold text-amber-300 mt-1 block">Human Decision AI</span>
              <span className="text-[11px] text-slate-500">Never Falsely Declares Safe</span>
            </div>
          </div>
        </div>
      </section>

      {/* The Real-World Problem */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-xs font-bold uppercase tracking-widest text-teal-400">The Problem</h2>
          <p className="mt-2 text-3xl font-bold text-white tracking-tight">
            Why Rural & Peri-Urban Water Monitoring Often Fails
          </p>
          <p className="mt-3 text-sm text-slate-400">
            Millions of community members depend on unmonitored borewells, handpumps, and municipal taps.
            Contamination events currently go unnoticed until clinical waterborne outbreaks occur.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-white">Delayed Outbreak Recognition</h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Traditional water testing relies on periodic manual samples sent to centralized labs, often taking weeks to return results while residents continue drinking contaminated water.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-white">Siloed Field Data & Sensor Gaps</h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Field workers record measurements in paper logs or isolated spreadsheets with no automated checks for sudden pH drops, turbidity surges after rains, or stale data gaps.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4">
              <Microscope className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-white">Unclear Safety Distinctions</h3>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Basic apps make dangerous claims that clear water is "safe", ignoring that physical sensors cannot detect deadly bacterial pathogens, arsenic, or chemical runoffs without laboratory testing.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works & Architecture */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-900/50 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-xs font-bold uppercase tracking-widest text-teal-400">System Architecture</h2>
            <p className="mt-2 text-3xl font-bold text-white tracking-tight">
              How JalRakshak AI Protects Community Water
            </p>
            <p className="mt-3 text-sm text-slate-400">
              A 5-tier pipeline connecting field measurements, transparent AI screening, early warning alerts, and laboratory confirmation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-teal-400 mb-2 block">STAGE 01</span>
                <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-cyan-400" />
                  Data Ingestion
                </h4>
                <p className="text-xs text-slate-400 mt-2">
                  Collects measurements manually or via simulated IoT telemetry (pH, Turbidity, TDS, Temp, EC).
                </p>
              </div>
              <span className="text-[10px] text-slate-400 font-mono mt-4 block">Physical Plausibility Checked</span>
            </div>

            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-cyan-400 mb-2 block">STAGE 02</span>
                <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-teal-400" />
                  Deterministic Rules
                </h4>
                <p className="text-xs text-slate-400 mt-2">
                  Transparent threshold screening against Bureau of Indian Standards IS 10500:2012 acceptable & permissible limits.
                </p>
              </div>
              <span className="text-[10px] text-slate-400 font-mono mt-4 block">IS 10500:2012 Engine</span>
            </div>

            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-indigo-400 mb-2 block">STAGE 03</span>
                <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-indigo-400" />
                  Statistical AI
                </h4>
                <p className="text-xs text-slate-400 mt-2">
                  Scikit-learn Isolation Forest identifies subtle multivariate deviations from historical source baselines (N &ge; 5).
                </p>
              </div>
              <span className="text-[10px] text-slate-400 font-mono mt-4 block">Isolation Forest Outliers</span>
            </div>

            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-amber-400 mb-2 block">STAGE 04</span>
                <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Early Warning
                </h4>
                <p className="text-xs text-slate-400 mt-2">
                  Deduplicated alerts generate in-app dispatches, map markers, and assign field inspection follow-up tasks.
                </p>
              </div>
              <span className="text-[10px] text-slate-400 font-mono mt-4 block">Zero-Spam Deduplication</span>
            </div>

            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-emerald-400 mb-2 block">STAGE 05</span>
                <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <Microscope className="w-4 h-4 text-emerald-400" />
                  Lab Verification
                </h4>
                <p className="text-xs text-slate-400 mt-2">
                  Field officers log verified certified lab tests for microbial coliform and heavy metals, completing the safety loop.
                </p>
              </div>
              <span className="text-[10px] text-slate-400 font-mono mt-4 block">Accredited Laboratory Report</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stakeholder Impact */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-teal-400">Impact & Accessibility</h2>
            <p className="mt-2 text-3xl font-bold text-white tracking-tight">
              Designed for Public Health Teams & Local Panchayats
            </p>
            <p className="mt-4 text-sm text-slate-300 leading-relaxed">
              JalRakshak AI bridges the gap between field monitoring agents and central water commissions.
              Whether an officer is taking a handheld pH probe measurement in a remote village or an administrator is monitoring district trends, all workflows are synchronized in real-time.
            </p>

            <div className="mt-6 space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-300">
                  <strong>Role-Based Access:</strong> Tailored views for Administrators, Field Officers, and Community Viewers.
                </span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-300">
                  <strong>Offline / Fallback Resilience:</strong> Water-risk map features synchronized list fallback when external map tiles cannot load.
                </span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-300">
                  <strong>Built-in Sensor Simulator:</strong> Test monsoon runoff, acidic industrial seepage, and saline contamination scenarios with 1-click.
                </span>
              </div>
            </div>

            <div className="mt-8">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition-colors"
              >
                Launch Application &rarr;
              </Link>
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-2xl">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center justify-between">
              <span>Interactive Surveillance Preview</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </h4>
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-white block">Shivaji Nagar Public Borewell</span>
                  <span className="text-[11px] text-slate-400">Pune, Maharashtra &bull; Handheld Probe</span>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                  IS 10500 Compliant
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-red-500/30 bg-red-950/20 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-white block">Singanallur Elevated Tank</span>
                  <span className="text-[11px] text-slate-400">Coimbatore, Tamil Nadu &bull; pH 5.40 (Acidic)</span>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/40">
                  Critical Alert
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-amber-500/30 bg-amber-950/20 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-white block">Dashashwamedh Community Tap</span>
                  <span className="text-[11px] text-slate-400">Varanasi, UP &bull; Turbidity 6.4 NTU (Spike)</span>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Threshold Exceeded
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Safety Disclaimer Footer Banner */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 bg-amber-950/30 border-t border-amber-900/40 text-amber-200">
        <div className="max-w-5xl mx-auto flex items-start gap-4">
          <ShieldCheck className="w-6 h-6 text-amber-400 shrink-0 mt-1" />
          <div className="text-xs leading-relaxed text-amber-300/90">
            <strong>OFFICIAL RESPONSIBLE-USE NOTICE:</strong> JalRakshak AI is an auxiliary risk screening and early warning decision-support system.
            Physical-chemical sensor measurements (pH, turbidity, temperature, TDS, EC) flag abnormal patterns but cannot detect microbiological pathogens (E. coli, cholera, salmonella), chemical pesticides, or heavy metals.
            Sensor readings must NEVER be used alone to certify water as safe to drink. Suspected contamination must be followed by accredited laboratory testing.
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950 py-8 px-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-teal-400" />
            <span className="font-semibold text-slate-300">JalRakshak AI</span>
            <span>&mdash; Build To Ship Environmental Innovation</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Powered by FastAPI, PyTorch/Scikit-Learn, React & Leaflet &bull; Clean Architecture
          </div>
        </div>
      </footer>
    </div>
  );
};
