import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getStudentDashboard } from '../services/auth';
import { getClassrooms } from '../services/classroom';
import { DashboardResponse } from '../types/auth';
import { Classroom } from '../types/classroom';
import { ClassroomCard } from './ClassroomCard';
import { JoinClassroomModal } from './JoinClassroomModal';
import {
  GraduationCap,
  BookOpen,
  BrainCircuit,
  FileQuestion,
  LogOut,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Plus,
} from 'lucide-react';

interface StudentDashboardProps {
  onSelectClassroom: (classroomId: number) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onSelectClassroom }) => {
  const { user, token, logout } = useAuth();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingClassrooms, setLoadingClassrooms] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState<boolean>(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const fetchJoinedClassrooms = async () => {
    if (!token) return;
    setLoadingClassrooms(true);
    try {
      const list = await getClassrooms(token);
      setClassrooms(list);
    } catch {
      // classrooms load failure handled gracefully
    } finally {
      setLoadingClassrooms(false);
    }
  };

  useEffect(() => {
    if (token) {
      setLoading(true);
      getStudentDashboard(token)
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

      fetchJoinedClassrooms();
    }
  }, [token]);

  const handleClassroomJoined = (newClass: Classroom) => {
    setClassrooms((prev) => [newClass, ...prev]);
    setSuccessBanner(`Successfully joined '${newClass.name}'!`);
    setTimeout(() => setSuccessBanner(null), 4000);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Student Profile & Greeting Hero */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-900 rounded-3xl p-8 sm:p-10 text-white shadow-xl shadow-indigo-950/10 relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 bg-blue-400/20 border border-blue-300/30 px-3 py-1 rounded-full text-blue-100 text-xs font-semibold uppercase tracking-wider">
              <GraduationCap className="w-3.5 h-3.5 text-blue-200" />
              <span>Student Workspace</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.full_name}!
            </h2>
            <p className="text-blue-100 text-sm max-w-xl">
              Access your enrolled classrooms, explore lecture notes, and take AI-generated practice quizzes.
            </p>
          </div>

          <div className="flex flex-col sm:items-end space-y-3">
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/20 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span className="font-mono">{user?.email}</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsJoinModalOpen(true)}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-500 hover:bg-indigo-400 active:bg-indigo-600 text-white text-xs font-semibold rounded-xl shadow-md transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Join Classroom</span>
              </button>
              <button
                onClick={logout}
                className="inline-flex items-center space-x-2 px-3 py-2 bg-white/15 hover:bg-white/25 active:bg-white/30 text-white text-xs font-semibold rounded-xl backdrop-blur-md transition cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {successBanner && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center space-x-3 text-xs font-medium animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* Module 2: Joined Classrooms Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800">My Classrooms</h3>
            <p className="text-xs text-slate-500">Course spaces you have joined</p>
          </div>

          <button
            onClick={() => setIsJoinModalOpen(true)}
            className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 border border-indigo-200 rounded-xl transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Join with Code</span>
          </button>
        </div>

        {loadingClassrooms ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-2 text-xs text-slate-400">Loading classrooms...</p>
          </div>
        ) : classrooms.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-dashed border-slate-300 text-center space-y-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl w-fit mx-auto">
              <BookOpen className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">No Classrooms Joined Yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You haven't joined any classrooms yet. Ask your lecturer for their 6-character classroom code to join!
            </p>
            <button
              onClick={() => setIsJoinModalOpen(true)}
              className="mt-2 inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Join Your First Class</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {classrooms.map((c) => (
              <ClassroomCard
                key={c.id}
                classroom={c}
                onSelect={onSelectClassroom}
                showCode={false}
              />
            ))}
          </div>
        )}
      </div>

      {/* Backend Role-Protected Verification Status */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Protected Route Authentication</h3>
              <p className="text-xs text-slate-500">Verified via JWT Bearer Token at <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">/api/v1/auth/student/dashboard</code></p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Role: Student Verified
          </span>
        </div>

        {loading ? (
          <div className="text-sm text-slate-500 py-3 flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Validating student permissions with backend...</span>
          </div>
        ) : error ? (
          <div className="text-sm text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-200">
            Failed to fetch protected student data: {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            {data?.features.map((feature, idx) => (
              <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200/60 rounded-xl flex items-start space-x-3">
                <Sparkles className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                <span className="text-xs font-medium text-slate-700">{feature}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Student Study Hub Quick Modules */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl w-fit mb-4">
            <BookOpen className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-800">Study Materials</h4>
          <p className="text-xs text-slate-500 mt-1">Access lecture notes, slides, and syllabus documents uploaded by your lecturers.</p>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-600">Module 2 Active</span>
            <span className="text-xs text-slate-400">ClassMate Core</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl w-fit mb-4">
            <FileQuestion className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-800">Practice Quizzes</h4>
          <p className="text-xs text-slate-500 mt-1">Test your comprehension with automated multiple-choice and conceptual quizzes.</p>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-600">Module 2 Active</span>
            <span className="text-xs text-slate-400">AI Powered</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition">
          <div className="p-3 bg-violet-50 text-violet-600 rounded-2xl w-fit mb-4">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-800">AI Tutor Chat</h4>
          <p className="text-xs text-slate-500 mt-1">Ask questions about your study topics and receive clear, step-by-step explanations.</p>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-violet-600">Module 2 Active</span>
            <span className="text-xs text-slate-400">Interactive</span>
          </div>
        </div>
      </div>

      {/* Join Modal */}
      {token && (
        <JoinClassroomModal
          token={token}
          isOpen={isJoinModalOpen}
          onClose={() => setIsJoinModalOpen(false)}
          onClassroomJoined={handleClassroomJoined}
        />
      )}
    </div>
  );
};
