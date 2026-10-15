import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Droplets, Shield, User, Lock, ArrowRight, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { UserRole } from "../types";

export const LoginPage: React.FC = () => {
  const { login, quickSwitchRole } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(username, password);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role: UserRole) => {
    setLoading(true);
    try {
      await quickSwitchRole(role);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-teal-500 selection:text-slate-950">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 group mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform">
            <Droplets className="w-7 h-7 text-slate-950 fill-slate-950" />
          </div>
        </Link>
        <h2 className="text-2xl font-extrabold tracking-tight text-white">
          Sign In to JalRakshak AI
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Water Quality Monitoring, Anomaly Detection & Surveillance Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-slate-900 py-8 px-6 sm:px-10 rounded-2xl border border-slate-800 shadow-2xl space-y-6">
          {error && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Username or Official Email
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center gap-2"
            >
              <span>{loading ? "Authenticating..." : "Sign In to Dashboard"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials 1-Click Login */}
          <div className="pt-4 border-t border-slate-800 text-left">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Instant Demo Review Accounts:
            </span>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleDemoLogin("Admin")}
                className="w-full p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-left flex items-center justify-between group transition-colors"
              >
                <div>
                  <span className="text-xs font-bold text-white block">Administrator (Director)</span>
                  <span className="text-[10px] text-slate-400">admin &bull; Full CRUD, system controls & settings</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-teal-400 transition-colors" />
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin("Field Officer")}
                className="w-full p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-left flex items-center justify-between group transition-colors"
              >
                <div>
                  <span className="text-xs font-bold text-white block">Field Officer</span>
                  <span className="text-[10px] text-slate-400">officer &bull; Log measurements, inspections & alarms</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-teal-400 transition-colors" />
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin("Community Viewer")}
                className="w-full p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-left flex items-center justify-between group transition-colors"
              >
                <div>
                  <span className="text-xs font-bold text-white block">Community Viewer</span>
                  <span className="text-[10px] text-slate-400">viewer &bull; Public risk screening and safety notices</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-teal-400 transition-colors" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
