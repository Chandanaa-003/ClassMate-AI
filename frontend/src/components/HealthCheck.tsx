import React, { useEffect, useState } from 'react';
import { fetchHealth } from '../services/api';
import { HealthCheckResponse } from '../types/health';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Database,
  Server,
  Cpu,
  Clock,
} from 'lucide-react';

export const HealthCheck: React.FC = () => {
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchHealth();
      setHealth(data);
      setLastChecked(new Date());
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to connect to the backend server.');
      }
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const isHealthy = health?.status === 'healthy';
  const isDbConnected = health?.database === 'connected';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">System & Database Health</h2>
            <p className="text-sm text-slate-500">Live backend verification & SQLite connection status</p>
          </div>
        </div>

        <button
          onClick={checkHealth}
          disabled={loading}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-200 rounded-xl transition duration-150 disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          <span>{loading ? 'Checking...' : 'Refresh Status'}</span>
        </button>
      </div>

      {error ? (
        <div className="mt-6 p-5 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-rose-800">Connection Failed</h3>
            <p className="text-xs text-rose-700 mt-1">{error}</p>
            <p className="text-xs text-rose-600 mt-2 font-mono bg-rose-100/60 p-2 rounded">
              Ensure the FastAPI backend is running at http://127.0.0.1:8000
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* API Status Card */}
          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">FastAPI Backend</span>
              <Server className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-3 flex items-center space-x-2">
              {isHealthy ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span className="text-sm font-bold text-emerald-700 capitalize">{health?.status}</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <span className="text-sm font-bold text-amber-700">Connecting...</span>
                </>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-500">{health?.project_name || 'Loading...'}</p>
          </div>

          {/* SQLite Status Card */}
          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">SQLite Database</span>
              <Database className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-3 flex items-center space-x-2">
              {isDbConnected ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span className="text-sm font-bold text-emerald-700 capitalize">{health?.database}</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5 text-rose-500" />
                  <span className="text-sm font-bold text-rose-700">Disconnected</span>
                </>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-500 font-mono">classmate.db</p>
          </div>

          {/* Environment */}
          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Environment</span>
              <Cpu className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-3">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-wide">
                {health?.environment || 'unknown'}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">v{health?.version || '0.1.0'}</p>
          </div>

          {/* Timestamp */}
          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Last Check</span>
              <Clock className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-3">
              <span className="text-sm font-medium text-slate-700">
                {lastChecked ? lastChecked.toLocaleTimeString() : 'Pending'}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">Auto-validating</p>
          </div>
        </div>
      )}
    </div>
  );
};

