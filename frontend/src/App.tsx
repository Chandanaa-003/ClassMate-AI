import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { StudentDashboard } from './components/StudentDashboard';
import { LecturerDashboard } from './components/LecturerDashboard';
import { ClassroomDetail } from './components/ClassroomDetail';
import { SubjectDetail } from './components/SubjectDetail';
import { HealthCheck } from './components/HealthCheck';
import { NotificationModal } from './components/NotificationModal';
import { Notification } from './types/notification';
import { Sparkles } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, token, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<'auth' | 'dashboard' | 'health'>('dashboard');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [selectedClassroomId, setSelectedClassroomId] = useState<number | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-medium text-slate-500">Loading ClassMate AI session...</p>
      </div>
    );
  }

  const handleSelectView = (view: 'auth' | 'dashboard' | 'health') => {
    setSelectedClassroomId(null);
    setSelectedSubjectId(null);
    setCurrentView(view);
  };

  const handleNavigateNotification = (notif: Notification) => {
    setCurrentView('dashboard');
    if (notif.classroom_id) {
      setSelectedClassroomId(notif.classroom_id);
    }
    if (notif.subject_id) {
      setSelectedSubjectId(notif.subject_id);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header
        currentView={currentView}
        onSelectView={handleSelectView}
        authMode={authMode}
        onSelectAuthMode={setAuthMode}
        onOpenNotifications={() => setIsNotificationModalOpen(true)}
        onNavigateNotification={handleNavigateNotification}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {currentView === 'health' ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-800">System Diagnostics</h2>
                <p className="text-sm text-slate-500">Live backend verification & SQLite connection status</p>
              </div>
              <button
                onClick={() => setCurrentView(user ? 'dashboard' : 'auth')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                &larr; Return to Application
              </button>
            </div>
            <HealthCheck />
          </div>
        ) : user && token ? (
          // Authenticated view routing: Subject Detail -> Classroom Detail -> Role Dashboard
          selectedSubjectId ? (
            <SubjectDetail
              token={token}
              subjectId={selectedSubjectId}
              userRole={user.role}
              onBackToClassroom={() => setSelectedSubjectId(null)}
              onBackToDashboard={() => {
                setSelectedSubjectId(null);
                setSelectedClassroomId(null);
              }}
              onSubjectDeleted={() => setSelectedSubjectId(null)}
            />
          ) : selectedClassroomId ? (
            <ClassroomDetail
              token={token}
              classroomId={selectedClassroomId}
              userRole={user.role}
              onBack={() => setSelectedClassroomId(null)}
              onSelectSubject={(subjectId) => setSelectedSubjectId(subjectId)}
              onLeftClassroom={() => {
                setSelectedClassroomId(null);
                setSelectedSubjectId(null);
              }}
            />
          ) : user.role === 'student' ? (
            <StudentDashboard
              onSelectClassroom={(id) => setSelectedClassroomId(id)}
            />
          ) : (
            <LecturerDashboard
              onSelectClassroom={(id) => setSelectedClassroomId(id)}
            />
          )
        ) : (
          // Unauthenticated Auth Flows
          <div className="space-y-10">
            {/* Top Pitch */}
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <div className="inline-flex items-center space-x-2 bg-indigo-50 border border-indigo-200/60 px-3 py-1 rounded-full text-indigo-700 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>ClassMate AI Platform</span>
              </div>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Empowering Students & Lecturers with AI
              </h2>
              <p className="text-slate-600 text-sm">
                Sign in with your university credentials or register a new role-based account to start.
              </p>
            </div>

            {/* Auth Form Card */}
            {authMode === 'login' ? (
              <Login onSwitchToRegister={() => setAuthMode('register')} />
            ) : (
              <Register onSwitchToLogin={() => setAuthMode('login')} />
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 mt-auto">
        <div className="max-w-6xl mx-auto px-4 text-center text-xs text-slate-400">
          ClassMate AI &copy; 2026. Module 9: Notifications and Classroom Announcements.
        </div>
      </footer>

      {user && token && (
        <NotificationModal
          token={token}
          isOpen={isNotificationModalOpen}
          onClose={() => setIsNotificationModalOpen(false)}
          onNavigateNotification={handleNavigateNotification}
        />
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
