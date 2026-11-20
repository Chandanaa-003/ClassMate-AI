import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getLecturerDashboard } from '../services/auth';
import { DashboardResponse } from '../types/auth';
import {
  BookOpenCheck,
  UploadCloud,
  FileCheck2,
  BarChart,
  LogOut,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

export const LecturerDashboard: React.FC = () => {
  const { user, token, logout } = useAuth();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      setLoading(true);
      getLecturerDashboard(token)
        .then((res) => {
          setData(res);
          setError(null);
        })
        .catch((err: Error) => {
          setError(err.message);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [token]);

  return (
    <div className="space-y-8">
      {/* Lecturer Profile & Greeting Hero */}
      <div className="bg-gradient-to-r from-purple-800 via-indigo-800 to-slate-900 rounded-3xl p-8 sm:p-10 text-white shadow-xl shadow-purple-950/10 relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 bg-purple-400/20 border border-purple-300/30 px-3 py-1 rounded-full text-purple-100 text-xs font-semibold uppercase tracking-wider">
              <BookOpenCheck className="w-3.5 h-3.5 text-purple-200" />
              <span>Lecturer Faculty Portal</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome, Prof. {user?.full_name}!
            </h2>
            <p className="text-purple-100 text-sm max-w-xl">
              Manage your courses, distribute lecture slides, generate automated quiz assessments, and review student engagement metrics.
            </p>
          </div>

          <div className="flex flex-col sm:items-end space-y-3">
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/20 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span className="font-mono">{user?.email}</span>
            </div>
            <button
              onClick={logout}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-white/15 hover:bg-white/25 active:bg-white/30 text-white text-xs font-semibold rounded-xl backdrop-blur-md transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Backend Role-Protected Verification Status */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Protected Lecturer Endpoint</h3>
              <p className="text-xs text-slate-500">Verified via JWT Bearer Token at <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">/api/v1/auth/lecturer/dashboard</code></p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            Role: Lecturer Verified
          </span>
        </div>

        {loading ? (
          <div className="text-sm text-slate-500 py-3 flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Validating lecturer permissions with backend...</span>
          </div>
        ) : error ? (
          <div className="text-sm text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-200">
            Failed to fetch protected lecturer data: {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            {data?.features.map((feature, idx) => (
              <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200/60 rounded-xl flex items-start space-x-3">
                <Sparkles className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                <span className="text-xs font-medium text-slate-700">{feature}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lecturer Quick Action Tools */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl w-fit mb-4">
            <UploadCloud className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-800">Course Materials</h4>
          <p className="text-xs text-slate-500 mt-1">Upload lecture PDFs, slide decks, and syllabi for your student cohorts.</p>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-600">Faculty Ready</span>
            <span className="text-xs text-slate-400">ClassMate Core</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl w-fit mb-4">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-800">AI Quiz Generator</h4>
          <p className="text-xs text-slate-500 mt-1">Instantly generate high-quality quiz question banks from your uploaded lecture notes.</p>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-600">Faculty Ready</span>
            <span className="text-xs text-slate-400">AI Powered</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl w-fit mb-4">
            <BarChart className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-800">Cohort Analytics</h4>
          <p className="text-xs text-slate-500 mt-1">Track which questions students struggle with and identify topics requiring revision.</p>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600">Faculty Ready</span>
            <span className="text-xs text-slate-400">Analytics</span>
          </div>
        </div>
      </div>
    </div>
  );
};
