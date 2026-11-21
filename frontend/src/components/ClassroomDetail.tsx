import React, { useEffect, useState, useMemo } from 'react';
import { getClassroomDetail, leaveClassroom } from '../services/classroom';
import { deleteSubject, getClassroomSubjects } from '../services/subject';
import { ClassroomDetail as IClassroomDetail } from '../types/classroom';
import { Subject } from '../types/subject';
import { UserRole } from '../types/auth';
import { Breadcrumbs } from './Breadcrumbs';
import { SubjectCard } from './SubjectCard';
import { SubjectModal } from './SubjectModal';
import { LecturerFeedbackAnalytics } from './LecturerFeedbackAnalytics';
import { AnnouncementList } from './AnnouncementList';
import {
  Users,
  Copy,
  Check,
  Calendar,
  LogOut,
  AlertCircle,
  BookOpen,
  GraduationCap,
  Search,
  Plus,
  Layers,
  Sparkles,
  BarChart3,
  Megaphone,
} from 'lucide-react';

interface ClassroomDetailProps {
  token: string;
  classroomId: number;
  userRole: UserRole;
  onBack: () => void;
  onSelectSubject: (subjectId: number) => void;
  onLeftClassroom?: () => void;
}

export const ClassroomDetail: React.FC<ClassroomDetailProps> = ({
  token,
  classroomId,
  userRole,
  onBack,
  onSelectSubject,
  onLeftClassroom,
}) => {
  const [classroom, setClassroom] = useState<IClassroomDetail | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [activeTab, setActiveTab] = useState<'subjects' | 'announcements' | 'members' | 'analytics'>('subjects');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Subject Modal state
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  const fetchDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getClassroomDetail(token, classroomId);
      setClassroom(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to load classroom details.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    setLoadingSubjects(true);
    try {
      const list = await getClassroomSubjects(token, classroomId);
      setSubjects(list);
    } catch {
      // handled gracefully
    } finally {
      setLoadingSubjects(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    fetchSubjects();
  }, [classroomId, token]);

  const handleCopyCode = () => {
    if (!classroom) return;
    navigator.clipboard.writeText(classroom.join_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeave = async () => {
    if (!classroom) return;
    const confirmLeave = window.confirm(
      `Are you sure you want to leave '${classroom.name}'? You will need the join code to re-enter.`
    );
    if (!confirmLeave) return;

    setLeaving(true);
    try {
      await leaveClassroom(token, classroomId);
      if (onLeftClassroom) {
        onLeftClassroom();
      } else {
        onBack();
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to leave classroom.');
      }
      setLeaving(false);
    }
  };

  const handleOpenCreateSubject = () => {
    setEditingSubject(null);
    setModalMode('create');
    setIsSubjectModalOpen(true);
  };

  const handleOpenEditSubject = (subject: Subject) => {
    setEditingSubject(subject);
    setModalMode('edit');
    setIsSubjectModalOpen(true);
  };

  const handleDeleteSubject = async (subjectId: number, subjectName: string) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete subject '${subjectName}'? This action cannot be undone.`
    );
    if (!confirmDelete) return;

    try {
      await deleteSubject(token, subjectId);
      setSubjects((prev) => prev.filter((s) => s.id !== subjectId));
      setSuccessBanner(`Subject '${subjectName}' deleted.`);
      setTimeout(() => setSuccessBanner(null), 3000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert('Failed to delete subject.');
      }
    }
  };

  const handleSubjectSuccess = (subject: Subject) => {
    if (modalMode === 'create') {
      setSubjects((prev) => [...prev, subject]);
      setSuccessBanner(`Subject '${subject.name}' created!`);
    } else {
      setSubjects((prev) => prev.map((s) => (s.id === subject.id ? subject : s)));
      setSuccessBanner(`Subject '${subject.name}' updated!`);
    }
    setTimeout(() => setSuccessBanner(null), 3000);
  };

  // Filter subjects by search query
  const filteredSubjects = useMemo(() => {
    if (!searchQuery.trim()) return subjects;
    const q = searchQuery.toLowerCase();
    return subjects.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.code && s.code.toLowerCase().includes(q)) ||
        (s.description && s.description.toLowerCase().includes(q))
    );
  }, [subjects, searchQuery]);

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-xs font-medium text-slate-500">Loading classroom...</p>
      </div>
    );
  }

  if (error || !classroom) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-4">
        <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl w-fit mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800">Unable to Access Classroom</h3>
        <p className="text-xs text-rose-600">{error || 'Classroom not found.'}</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
        >
          &larr; Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Breadcrumbs
          items={[
            { label: 'Classrooms', onClick: onBack },
            { label: classroom.name, active: true },
          ]}
        />

        <div className="flex items-center space-x-2">
          {classroom.is_lecturer && (
            <button
              onClick={handleOpenCreateSubject}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Subject</span>
            </button>
          )}

          {userRole === 'student' && (
            <button
              onClick={handleLeave}
              disabled={leaving}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition cursor-pointer disabled:opacity-50"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{leaving ? 'Leaving...' : 'Leave Classroom'}</span>
            </button>
          )}
        </div>
      </div>

      {successBanner && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center space-x-3 text-xs font-medium animate-fade-in">
          <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* Classroom Hero Card */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-8 sm:p-10 text-white shadow-xl shadow-indigo-950/10">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center space-x-2 bg-indigo-500/20 border border-indigo-400/30 px-3 py-1 rounded-full text-indigo-200 text-xs font-semibold">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Course Space</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {classroom.name}
            </h1>
            <p className="text-indigo-200 text-sm leading-relaxed">
              {classroom.description || 'No course description provided.'}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-indigo-200">
              <span className="flex items-center space-x-1.5">
                <GraduationCap className="w-4 h-4 text-indigo-300" />
                <span>Instructor: <strong className="text-white font-medium">{classroom.lecturer_name}</strong></span>
              </span>
              <span className="flex items-center space-x-1.5">
                <Calendar className="w-4 h-4 text-indigo-300" />
                <span>Created: {new Date(classroom.created_at).toLocaleDateString()}</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <Layers className="w-4 h-4 text-indigo-300" />
                <span>{subjects.length} {subjects.length === 1 ? 'Subject' : 'Subjects'}</span>
              </span>
            </div>
          </div>

          {/* Join Code Display Card */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl flex flex-col items-center justify-center min-w-[200px] text-center">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-200">
              Classroom Join Code
            </span>
            <div className="mt-2 text-xl font-mono font-bold tracking-widest text-white">
              {classroom.join_code}
            </div>
            <button
              onClick={handleCopyCode}
              className="mt-3 inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs (Subjects vs Members) */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('subjects')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'subjects'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Subjects ({subjects.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('announcements')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'announcements'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>Announcements</span>
        </button>

        <button
          onClick={() => setActiveTab('members')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'members'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Members ({classroom.members.length})</span>
        </button>

        {classroom.is_lecturer && (
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Classroom Analytics</span>
          </button>
        )}
      </div>

      {/* Tab Content: Subjects */}
      {activeTab === 'subjects' && (
        <div className="space-y-6">
          {/* Search bar & Action Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search subjects by name, code or topic..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
              />
            </div>

            {classroom.is_lecturer && (
              <button
                onClick={handleOpenCreateSubject}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Subject</span>
              </button>
            )}
          </div>

          {loadingSubjects ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="mt-2 text-xs text-slate-400">Loading subjects...</p>
            </div>
          ) : filteredSubjects.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 border border-dashed border-slate-300 text-center space-y-3">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl w-fit mx-auto">
                <BookOpen className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">
                {searchQuery ? 'No Subjects Found Matching Search' : 'No Subjects Added Yet'}
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery
                  ? `No subjects match '${searchQuery}'. Try another search query.`
                  : classroom.is_lecturer
                  ? 'Organize your course syllabus into distinct subjects (e.g. Linear Algebra, Neural Networks) to attach study materials.'
                  : 'Your lecturer has not added any subjects to this classroom yet.'}
              </p>
              {classroom.is_lecturer && !searchQuery && (
                <button
                  onClick={handleOpenCreateSubject}
                  className="mt-2 inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create First Subject</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSubjects.map((s) => (
                <SubjectCard
                  key={s.id}
                  subject={s}
                  onSelect={onSelectSubject}
                  onEdit={classroom.is_lecturer ? handleOpenEditSubject : undefined}
                  onDelete={classroom.is_lecturer ? handleDeleteSubject : undefined}
                  isLecturer={classroom.is_lecturer}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Members */}
      {activeTab === 'members' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between pb-5 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Classroom Members</h3>
                <p className="text-xs text-slate-500">Students enrolled in this course space</p>
              </div>
            </div>

            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-xs font-semibold">
              {classroom.members.length} {classroom.members.length === 1 ? 'Member' : 'Members'}
            </span>
          </div>

          {classroom.members.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-medium">No students have joined this classroom yet.</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Share the join code <strong className="font-mono text-indigo-600">{classroom.join_code}</strong> with your students.
              </p>
            </div>
          ) : (
            <div className="mt-6 divide-y divide-slate-100">
              {classroom.members.map((member) => (
                <div
                  key={member.id}
                  className="py-3.5 flex items-center justify-between hover:bg-slate-50/60 px-3 rounded-xl transition"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                      {member.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{member.full_name}</h4>
                      <p className="text-[11px] text-slate-400 font-mono">{member.email}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[10px] font-semibold uppercase tracking-wider">
                      {member.role}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Joined {new Date(member.joined_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Module 8 Classroom Analytics */}
      {activeTab === 'analytics' && classroom.is_lecturer && (
        <LecturerFeedbackAnalytics
          token={token}
          classroomId={classroom.id}
          title={`${classroom.name} - Classroom Overview`}
          onSelectSubject={onSelectSubject}
        />
      )}

      {/* Tab Content: Module 9 Classroom Announcements */}
      {activeTab === 'announcements' && (
        <AnnouncementList
          token={token}
          classroomId={classroom.id}
          isLecturer={classroom.is_lecturer}
          subjects={subjects}
        />
      )}

      {/* Create/Edit Subject Modal */}
      {isSubjectModalOpen && (
        <SubjectModal
          token={token}
          classroomId={classroom.id}
          isOpen={isSubjectModalOpen}
          onClose={() => setIsSubjectModalOpen(false)}
          onSuccess={handleSubjectSuccess}
          mode={modalMode}
          initialData={editingSubject}
        />
      )}
    </div>
  );
};
