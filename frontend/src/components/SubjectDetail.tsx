import React, { useEffect, useState } from 'react';
import { deleteSubject, getSubject } from '../services/subject';
import { getSubjectDoubts } from '../services/doubt';
import { Subject } from '../types/subject';
import { Doubt } from '../types/doubt';
import { UserRole } from '../types/auth';
import { Breadcrumbs } from './Breadcrumbs';
import { SubjectModal } from './SubjectModal';
import { AskDoubtModal } from './AskDoubtModal';
import { DoubtCard } from './DoubtCard';
import { DoubtThread } from './DoubtThread';
import { LectureLibrary } from './LectureLibrary';
import {
  BookOpen,
  Calendar,
  User,
  Edit2,
  Trash2,
  AlertCircle,
  HelpCircle,
  Plus,
  Search,
  ArrowLeft,
  Sparkles,
  Headphones,
} from 'lucide-react';

interface SubjectDetailProps {
  token: string;
  subjectId: number;
  userRole: UserRole;
  onBackToClassroom: () => void;
  onBackToDashboard: () => void;
  onSubjectDeleted?: () => void;
}

export const SubjectDetail: React.FC<SubjectDetailProps> = ({
  token,
  subjectId,
  userRole,
  onBackToClassroom,
  onBackToDashboard,
  onSubjectDeleted,
}) => {
  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'lectures' | 'doubts' | 'materials'>('lectures');

  // Doubts state
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [loadingDoubts, setLoadingDoubts] = useState(true);
  const [doubtSearch, setDoubtSearch] = useState('');
  const [doubtFilter, setDoubtFilter] = useState<'latest' | 'unanswered' | 'popular' | 'resolved'>('latest');
  const [isAskModalOpen, setIsAskModalOpen] = useState(false);
  const [selectedDoubtId, setSelectedDoubtId] = useState<number | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const fetchSubject = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSubject(token, subjectId);
      setSubject(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to load subject details.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchDoubts = async () => {
    setLoadingDoubts(true);
    try {
      const list = await getSubjectDoubts(token, subjectId, doubtSearch, doubtFilter);
      setDoubts(list);
    } catch {
      // handled gracefully
    } finally {
      setLoadingDoubts(false);
    }
  };

  useEffect(() => {
    fetchSubject();
  }, [subjectId, token]);

  useEffect(() => {
    if (!selectedDoubtId) {
      fetchDoubts();
    }
  }, [subjectId, token, doubtFilter, doubtSearch, selectedDoubtId]);

  const handleDelete = async () => {
    if (!subject) return;
    const confirmDelete = window.confirm(
      `Are you sure you want to delete '${subject.name}'? All doubts and materials associated with it will be removed.`
    );
    if (!confirmDelete) return;

    setDeleting(true);
    try {
      await deleteSubject(token, subject.id);
      if (onSubjectDeleted) {
        onSubjectDeleted();
      } else {
        onBackToClassroom();
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to delete subject.');
      }
      setDeleting(false);
    }
  };

  const handleDoubtCreated = (newDoubt: Doubt) => {
    setDoubts((prev) => [newDoubt, ...prev]);
    setSuccessBanner('Your question has been posted to the discussion board!');
    setTimeout(() => setSuccessBanner(null), 4000);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
        <div className="w-8 h-8 border-3 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-xs font-medium text-slate-500">Loading subject details...</p>
      </div>
    );
  }

  if (error || !subject) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-4">
        <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl w-fit mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800">Subject Not Found</h3>
        <p className="text-xs text-rose-600">{error || 'Unable to access subject details.'}</p>
        <button
          onClick={onBackToClassroom}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
        >
          &larr; Back to Classroom
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Breadcrumb Navigation Trail */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Breadcrumbs
          items={[
            { label: 'Classrooms', onClick: onBackToDashboard },
            { label: subject.classroom_name, onClick: onBackToClassroom },
            { label: subject.name, active: true },
          ]}
        />

        <div className="flex items-center space-x-2">
          <button
            onClick={onBackToClassroom}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Classroom</span>
          </button>

          {subject.is_lecturer && (
            <>
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-xl transition cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deleting ? 'Deleting...' : 'Delete'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {successBanner && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center space-x-3 text-xs font-medium animate-fade-in">
          <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* Subject Header Hero */}
      <div className="bg-gradient-to-br from-violet-900 via-indigo-900 to-slate-900 rounded-3xl p-8 sm:p-10 text-white shadow-xl shadow-violet-950/10">
        <div className="space-y-4 max-w-3xl">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-violet-500/20 border border-violet-400/30 rounded-xl text-violet-300">
              <BookOpen className="w-4 h-4" />
            </div>
            {subject.code ? (
              <span className="px-2.5 py-0.5 bg-violet-500/20 border border-violet-400/30 rounded-lg text-xs font-mono font-bold text-violet-200">
                {subject.code}
              </span>
            ) : (
              <span className="text-xs font-semibold text-violet-300 uppercase tracking-wider">
                Subject Workspace
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            {subject.name}
          </h1>

          <p className="text-violet-200 text-sm sm:text-base leading-relaxed">
            {subject.description || 'No subject description provided yet.'}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-violet-300">
            <span className="flex items-center space-x-1.5">
              <User className="w-4 h-4 text-violet-400" />
              <span>Instructor: <strong className="text-white font-medium">{subject.creator_name}</strong></span>
            </span>
            <span className="flex items-center space-x-1.5">
              <Calendar className="w-4 h-4 text-violet-400" />
              <span>Created on {new Date(subject.created_at).toLocaleDateString()}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Workspace Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200/80 pb-2">
        <button
          onClick={() => {
            setActiveWorkspaceTab('lectures');
            setSelectedDoubtId(null);
          }}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer ${
            activeWorkspaceTab === 'lectures'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Headphones className="w-4 h-4" />
          <span>Lecture Library & Audio</span>
        </button>

        <button
          onClick={() => setActiveWorkspaceTab('doubts')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer ${
            activeWorkspaceTab === 'doubts'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Anonymous Doubt Board</span>
        </button>

        <button
          onClick={() => {
            setActiveWorkspaceTab('materials');
            setSelectedDoubtId(null);
          }}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer ${
            activeWorkspaceTab === 'materials'
              ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Study Materials</span>
        </button>
      </div>

      {/* Tab Content: Module 5 Lecture Library */}
      {activeWorkspaceTab === 'lectures' && (
        <LectureLibrary
          token={token}
          subjectId={subject.id}
          userRole={userRole}
          isClassroomLecturer={subject.is_lecturer}
        />
      )}

      {/* Tab Content: Module 4 Anonymous Doubt Discussion Board */}
      {activeWorkspaceTab === 'doubts' && (
        selectedDoubtId ? (
        <DoubtThread
          token={token}
          doubtId={selectedDoubtId}
          onBack={() => setSelectedDoubtId(null)}
          onDoubtDeleted={() => {
            setSelectedDoubtId(null);
            fetchDoubts();
          }}
        />
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
                <HelpCircle className="w-5 h-5 text-amber-500" />
                <span>Anonymous Doubt Discussions</span>
              </h2>
              <p className="text-xs text-slate-500">
                Ask questions anonymously without fear of judgment. Classmates and lecturers can answer.
              </p>
            </div>

            <button
              onClick={() => setIsAskModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow-md transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Ask a Doubt</span>
            </button>
          </div>

          {/* Search bar & Filter Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={doubtSearch}
                onChange={(e) => setDoubtSearch(e.target.value)}
                placeholder="Search questions by keyword..."
                className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
              {(
                [
                  { id: 'latest', label: 'Latest' },
                  { id: 'unanswered', label: 'Unanswered' },
                  { id: 'popular', label: 'Most Popular' },
                  { id: 'resolved', label: 'Resolved' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setDoubtFilter(tab.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    doubtFilter === tab.id
                      ? 'bg-white text-slate-800 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Questions List */}
          {loadingDoubts ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="mt-2 text-xs text-slate-400">Loading questions...</p>
            </div>
          ) : doubts.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 border border-dashed border-slate-300 text-center space-y-3">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl w-fit mx-auto">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                {doubtSearch ? 'No Questions Match Your Search' : 'No Doubts Asked Yet'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {doubtSearch
                  ? `No questions match '${doubtSearch}'. Try adjusting your search keywords.`
                  : 'Have a question about this subject? Click below to ask your classmates and lecturers anonymously.'}
              </p>
              <button
                onClick={() => setIsAskModalOpen(true)}
                className="mt-2 inline-flex items-center space-x-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow-md transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Ask the First Doubt</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {doubts.map((d) => (
                <DoubtCard
                  key={d.id}
                  doubt={d}
                  onSelect={(id) => setSelectedDoubtId(id)}
                />
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Tab Content: Study Materials Placeholder */}
      {activeWorkspaceTab === 'materials' && (
        <div className="bg-white rounded-3xl p-10 border border-slate-200/80 text-center space-y-3 shadow-sm">
          <div className="w-12 h-12 bg-violet-50 text-violet-600 rounded-2xl mx-auto flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">Study Materials & Notes</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Lecture slides, notes, AI automated summaries, and quizzes will be available in this section.
          </p>
        </div>
      )}

      {/* Ask Doubt Modal */}
      {isAskModalOpen && (
        <AskDoubtModal
          token={token}
          subjectId={subject.id}
          isOpen={isAskModalOpen}
          onClose={() => setIsAskModalOpen(false)}
          onDoubtCreated={handleDoubtCreated}
        />
      )}

      {/* Edit Subject Modal */}
      {isEditModalOpen && (
        <SubjectModal
          token={token}
          classroomId={subject.classroom_id}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={(updated) => {
            setSubject(updated);
          }}
          mode="edit"
          initialData={subject}
        />
      )}
    </div>
  );
};
