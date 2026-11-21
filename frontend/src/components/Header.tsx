import React from 'react';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, LogOut, Activity, LayoutDashboard } from 'lucide-react';
import { NotificationBell } from './NotificationBell';
import { Notification } from '../types/notification';

interface HeaderProps {
  currentView: 'auth' | 'dashboard' | 'health';
  onSelectView: (view: 'auth' | 'dashboard' | 'health') => void;
  authMode: 'login' | 'register';
  onSelectAuthMode: (mode: 'login' | 'register') => void;
  onOpenNotifications?: () => void;
  onNavigateNotification?: (notif: Notification) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onSelectView,
  authMode,
  onSelectAuthMode,
  onOpenNotifications,
  onNavigateNotification,
}) => {
  const { user, token, logout } = useAuth();

  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo and Brand */}
        <div
          onClick={() => onSelectView(user ? 'dashboard' : 'auth')}
          className="flex items-center space-x-3 cursor-pointer select-none"
        >
          <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-100">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              ClassMate AI
            </h1>
            <p className="text-xs text-slate-500 font-medium">Intelligent Learning Assistant</p>
          </div>
        </div>

        {/* Navigation & Auth Status */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* View Toggle */}
          <button
            onClick={() => onSelectView(currentView === 'health' ? (user ? 'dashboard' : 'auth') : 'health')}
            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition cursor-pointer ${
              currentView === 'health'
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                : 'text-slate-600 hover:text-slate-800 border-slate-200 bg-white'
            }`}
          >
            {currentView === 'health' ? (
              <>
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden sm:inline">Back to App</span>
              </>
            ) : (
              <>
                <Activity className="w-4 h-4 text-emerald-500" />
                <span className="hidden sm:inline">System Health</span>
              </>
            )}
          </button>

          {user ? (
            <div className="flex items-center space-x-3">
              {token && onOpenNotifications && (
                <NotificationBell
                  token={token}
                  onOpenFullCenter={onOpenNotifications}
                  onNavigateNotification={onNavigateNotification}
                />
              )}

              <div className="hidden sm:flex items-center space-x-2 pl-3 border-l border-slate-200">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                  {user.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-slate-800 leading-none">{user.full_name}</div>
                  <span
                    className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold uppercase tracking-wider mt-0.5 ${
                      user.role === 'student'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-purple-50 text-purple-700 border border-purple-200'
                    }`}
                  >
                    {user.role}
                  </span>
                </div>
              </div>

              <button
                onClick={logout}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  onSelectView('auth');
                  onSelectAuthMode('login');
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition cursor-pointer ${
                  currentView === 'auth' && authMode === 'login'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  onSelectView('auth');
                  onSelectAuthMode('register');
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition cursor-pointer ${
                  currentView === 'auth' && authMode === 'register'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                }`}
              >
                Register
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
