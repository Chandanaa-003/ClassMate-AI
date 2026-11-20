import React, { useEffect, useState } from 'react';
import { deleteLecture, getLectureAudioStreamUrl, getSubjectLectures } from '../services/lecture';
import { Lecture } from '../types/lecture';
import { UserRole } from '../types/auth';
import { AudioPlayer } from './AudioPlayer';
import { RecordLectureModal } from './RecordLectureModal';
import { UploadLectureModal } from './UploadLectureModal';
import { ReviewLectureModal } from './ReviewLectureModal';
import {
  Mic,
  Upload,
  Search,
  Headphones,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trash2,
  Calendar,
  User,
  Volume2,
  ShieldCheck,
  Radio,
} from 'lucide-react';

interface LectureLibraryProps {
  token: string;
  subjectId: number;
  userRole: UserRole;
  isClassroomLecturer: boolean;
}

export const LectureLibrary: React.FC<LectureLibraryProps> = ({
  token,
  subjectId,
  userRole,
  isClassroomLecturer,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'library' | 'review' | 'mine'>('library');
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [pendingLectures, setPendingLectures] = useState<Lecture[]>([]);
  const [myLectures, setMyLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activePlayerId, setActivePlayerId] = useState<number | null>(null);

  // Modals
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedReviewLecture, setSelectedReviewLecture] = useState<Lecture | null>(null);
  const [bannerMessage, setBannerMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchLectures = async () => {
    setLoading(true);
    try {
      // 1. Fetch public library (APPROVED)
      const approvedList = await getSubjectLectures(token, subjectId, { status: 'APPROVED' });
      setLectures(approvedList);

      // 2. Fetch My Uploads
      const myList = await getSubjectLectures(token, subjectId, { mine: true });
      setMyLectures(myList);

      // 3. If Lecturer, fetch Pending reviews
      if (isClassroomLecturer) {
        const pendingList = await getSubjectLectures(token, subjectId, { status: 'PENDING' });
        setPendingLectures(pendingList);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setBannerMessage({ type: 'error', text: err.message });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLectures();
  }, [token, subjectId, isClassroomLecturer]);

  const handleDelete = async (lectureId: number, title: string) => {
    if (!window.confirm(`Are you sure you want to delete '${title}'? This action cannot be undone.`)) {
      return;
    }
    try {
      await deleteLecture(token, lectureId);
      setBannerMessage({ type: 'success', text: `Lecture '${title}' deleted successfully.` });
      fetchLectures();
      if (activePlayerId === lectureId) {
        setActivePlayerId(null);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setBannerMessage({ type: 'error', text: err.message });
      }
    }
  };

  // Determine current active list based on sub-tab
  const currentList =
    activeSubTab === 'library'
      ? lectures
      : activeSubTab === 'review'
      ? pendingLectures
      : myLectures;

  // Filter list by search query
  const filteredList = currentList.filter(
    (l) =>
      l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.description && l.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      l.uploader_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDuration = (secs?: number | null) => {
    if (!secs) return 'N/A';
    const mins = Math.floor(secs / 60);
    const s = Math.round(secs % 60);
    return `${mins}m ${s}s`;
  };

  return (
    <div className="space-y-6">
      {/* Action Notification Banner */}
      {bannerMessage && (
        <div
          className={`flex items-center justify-between p-4 rounded-2xl text-xs font-semibold animate-fadeIn ${
            bannerMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            {bannerMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{bannerMessage.text}</span>
          </div>
          <button
            onClick={() => setBannerMessage(null)}
            className="text-xs opacity-70 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header and Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
            <Headphones className="w-5 h-5 text-indigo-600" />
            <span>Lecture Audio Library</span>
          </h2>
          <p className="text-xs text-slate-500">
            Listen to official lectures, class audio recordings, and study recaps.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsRecordModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-600/20 transition cursor-pointer"
          >
            <Radio className="w-4 h-4" />
            <span>Record Audio</span>
          </button>

          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 transition cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Audio</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm">
        {/* Navigation Sub-Tabs */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveSubTab('library')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeSubTab === 'library'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Library ({lectures.length})
          </button>

          {isClassroomLecturer && (
            <button
              onClick={() => setActiveSubTab('review')}
              className={`relative px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                activeSubTab === 'review'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Review Queue</span>
              {pendingLectures.length > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px] font-bold">
                  {pendingLectures.length}
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => setActiveSubTab('mine')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeSubTab === 'mine'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            My Uploads ({myLectures.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search lectures..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
          />
        </div>
      </div>

      {/* Lectures List */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading lecture library...</div>
      ) : filteredList.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 border border-slate-200/80 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl mx-auto flex items-center justify-center">
            <Headphones className="w-6 h-6" />
          </div>
          <div className="max-w-sm mx-auto space-y-1">
            <h4 className="text-sm font-bold text-slate-800">
              {activeSubTab === 'review'
                ? 'Review queue is clear'
                : activeSubTab === 'mine'
                ? 'You have not uploaded any recordings yet'
                : 'No lectures available yet'}
            </h4>
            <p className="text-xs text-slate-500">
              {activeSubTab === 'review'
                ? 'All submitted lecture recordings have been reviewed and processed.'
                : 'Record or upload class audio to share with your peers and educators.'}
            </p>
          </div>
          {activeSubTab !== 'review' && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setIsRecordModalOpen(true)}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition"
              >
                <Mic className="w-4 h-4" />
                <span>Record Audio</span>
              </button>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Audio</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredList.map((lecture) => {
            const isPlaying = activePlayerId === lecture.id;
            const audioUrl = getLectureAudioStreamUrl(token, lecture.id);

            return (
              <div
                key={lecture.id}
                className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 hover:border-indigo-300 transition shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-extrabold text-slate-800 text-base">{lecture.title}</h3>

                      {/* Status Badges */}
                      {lecture.approval_status === 'APPROVED' && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Approved</span>
                        </span>
                      )}
                      {lecture.approval_status === 'PENDING' && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3" />
                          <span>Pending Review</span>
                        </span>
                      )}
                      {lecture.approval_status === 'REJECTED' && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle className="w-3 h-3" />
                          <span>Rejected</span>
                        </span>
                      )}
                    </div>

                    {lecture.description && (
                      <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                        {lecture.description}
                      </p>
                    )}

                    {/* Metadata */}
                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 pt-1">
                      <span className="flex items-center space-x-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          Uploaded by <strong className="text-slate-600">{lecture.uploader_name}</strong>
                          {lecture.uploader_role === 'lecturer' ? ' (Lecturer)' : ''}
                        </span>
                      </span>

                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{new Date(lecture.created_at).toLocaleDateString()}</span>
                      </span>

                      {lecture.duration && (
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatDuration(lecture.duration)}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Review Button for Lecturer on Pending items */}
                    {isClassroomLecturer && lecture.approval_status === 'PENDING' && (
                      <button
                        onClick={() => setSelectedReviewLecture(lecture)}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Review</span>
                      </button>
                    )}

                    {/* Play/Listen Button */}
                    <button
                      onClick={() => setActivePlayerId(isPlaying ? null : lecture.id)}
                      className={`inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer ${
                        isPlaying
                          ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
                      }`}
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{isPlaying ? 'Hide Player' : 'Listen'}</span>
                    </button>

                    {/* Delete button if permitted */}
                    {lecture.can_delete && (
                      <button
                        onClick={() => handleDelete(lecture.id, lecture.title)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                        title="Delete lecture"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Rejection Reason Notice if Rejected */}
                {lecture.approval_status === 'REJECTED' && lecture.rejection_reason && (
                  <div className="p-3 bg-rose-50/80 border border-rose-200 rounded-2xl text-xs text-rose-800 space-y-1">
                    <span className="font-bold flex items-center space-x-1.5 text-rose-900">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Rejection Feedback from Instructor:</span>
                    </span>
                    <p className="text-rose-700 pl-5">{lecture.rejection_reason}</p>
                  </div>
                )}

                {/* Audio Player when opened */}
                {isPlaying && (
                  <div className="pt-2 animate-fadeIn">
                    <AudioPlayer
                      src={audioUrl}
                      title={lecture.title}
                      initialDuration={lecture.duration}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Record Modal */}
      <RecordLectureModal
        token={token}
        subjectId={subjectId}
        userRole={userRole}
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        onLectureCreated={() => {
          setBannerMessage({ type: 'success', text: 'Audio recording uploaded successfully!' });
          fetchLectures();
        }}
      />

      {/* Upload Modal */}
      <UploadLectureModal
        token={token}
        subjectId={subjectId}
        userRole={userRole}
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onLectureUploaded={() => {
          setBannerMessage({ type: 'success', text: 'Lecture audio file uploaded successfully!' });
          fetchLectures();
        }}
      />

      {/* Review Modal */}
      <ReviewLectureModal
        token={token}
        lecture={selectedReviewLecture}
        isOpen={!!selectedReviewLecture}
        onClose={() => setSelectedReviewLecture(null)}
        onReviewed={() => {
          setBannerMessage({ type: 'success', text: 'Lecture review submitted.' });
          fetchLectures();
        }}
      />
    </div>
  );
};

