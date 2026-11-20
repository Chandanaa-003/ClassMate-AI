import React from 'react';
import { Header } from './components/Header';
import { HealthCheck } from './components/HealthCheck';
import { Layers, Database, ShieldCheck, Terminal, BookOpen, Sparkles } from 'lucide-react';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Hero Section */}
        <div className="text-center sm:text-left sm:flex sm:items-center sm:justify-between bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-8 sm:p-10 text-white shadow-xl shadow-indigo-950/10 relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center space-x-2 bg-indigo-500/20 border border-indigo-400/30 px-3 py-1 rounded-full text-indigo-200 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
              <span>Project Foundation Ready</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              ClassMate AI Workspace
            </h2>
            <p className="text-indigo-200 text-sm sm:text-base leading-relaxed">
              Full-stack foundation powered by React 18, Vite, Tailwind CSS, Python FastAPI, and SQLite.
              Ready for core AI learning assistance capabilities.
            </p>
          </div>

          <div className="hidden lg:flex items-center space-x-3 opacity-90">
            <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10 text-center">
              <Layers className="w-8 h-8 mx-auto text-indigo-300" />
              <span className="block text-xs font-semibold mt-1">Modular</span>
            </div>
            <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10 text-center">
              <Database className="w-8 h-8 mx-auto text-indigo-300" />
              <span className="block text-xs font-semibold mt-1">SQLite</span>
            </div>
            <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10 text-center">
              <ShieldCheck className="w-8 h-8 mx-auto text-indigo-300" />
              <span className="block text-xs font-semibold mt-1">Type-Safe</span>
            </div>
          </div>
        </div>

        {/* Live System Health Monitor */}
        <HealthCheck />

        {/* Foundation Architecture Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Backend Stack Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2.5 bg-violet-50 text-violet-600 rounded-xl">
                <Terminal className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-800">FastAPI + SQLite Backend</h3>
            </div>
            <ul className="space-y-2.5 text-sm text-slate-600">
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500"></span>
                <span>FastAPI 0.110+ with asynchronous routing and CORS middleware</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500"></span>
                <span>SQLAlchemy 2.0 ORM with SQLite database integration</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500"></span>
                <span>Pydantic v2 schemas and environment configuration management</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500"></span>
                <span>Automated health verification endpoints at <code className="text-xs bg-slate-100 px-1 py-0.5 rounded font-mono">/health</code></span>
              </li>
            </ul>
          </div>

          {/* Frontend Stack Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-800">React + Vite + Tailwind Frontend</h3>
            </div>
            <ul className="space-y-2.5 text-sm text-slate-600">
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                <span>React 18 with TypeScript for type-safe components</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                <span>Vite build tooling with instant HMR and API proxying</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                <span>Tailwind CSS utility styling with Lucide icons</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                <span>Modular service and component structure for future feature expansion</span>
              </li>
            </ul>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 mt-auto">
        <div className="max-w-6xl mx-auto px-4 text-center text-xs text-slate-400">
          ClassMate AI &copy; 2026. Built with FastAPI, SQLite, React, Vite, and Tailwind CSS.
        </div>
      </footer>
    </div>
  );
};

export default App;

