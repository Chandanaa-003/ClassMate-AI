import React, { useState } from 'react';
import { getLectureAudioStreamUrl, reviewLecture } from '../services/lecture';
import { Lecture } from '../types/lecture';
import { AudioPlayer } from './AudioPlayer';
import { CheckCircle2, XCircle, X, AlertCircle, User, Clock, FileText } from 'lucide-react';

interface ReviewLectureModalProps {
  token: string;
  lecture: Lecture | null;
  isOpen: boolean;
  onClose: () => void;
  onReviewed: () => void;
}

export const ReviewLectureModal: React.FC<ReviewLectureModalProps> = ({
  token,
  lecture,
  isOpen,
  onClose,
  onReviewed,
}) => {
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !lecture) return null;

  const handleClose = () => {
    setRejectionReason('');
    setShowRejectForm(false);
    setError(null);
    onClose();
  };

  const handleApprove = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await reviewLecture(token, lecture.id, { status: 'APPROVED' });
      onReviewed();
      handleClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to approve lecture.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await reviewLecture(token, lecture.id, {
        status: 'REJECTED',
        rejection_reason: rejectionReason.trim() || 'Rejected by instructor.',
      });
      onReviewed();
      handleClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to reject lecture.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const audioStreamUrl = getLectureAudioStreamUrl(token, lecture.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              Faculty Review Queue
            </span>
            <h3 className="text-lg font-bold text-slate-800 mt-1">Review Lecture Recording</h3>
          </div>
          <button
            onClick={handleClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="flex items-start space-x-2.5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Metadata Details */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3 text-xs">
          <div>
            <h4 className="font-bold text-sm text-slate-800">{lecture.title}</h4>
            {lecture.description && (
              <p className="text-slate-600 mt-1 leading-relaxed">{lecture.description}</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-slate-500 pt-1 border-t border-slate-200/60">
            <span className="flex items-center space-x-1">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>
                Uploader: <strong className="text-slate-700">{lecture.uploader_name}</strong> ({lecture.uploader_role})
              </span>
            </span>
            <span className="flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{new Date(lecture.created_at).toLocaleDateString()}</span>
            </span>
            {lecture.duration && (
              <span className="flex items-center space-x-1">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>~{Math.round(lecture.duration)}s</span>
              </span>
            )}
          </div>
        </div>

        {/* Audio Player */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">Audio Preview & Quality Check</label>
          <AudioPlayer
            src={audioStreamUrl}
            title={lecture.title}
            initialDuration={lecture.duration}
          />
        </div>

        {/* Rejection Reason Form */}
        {showRejectForm ? (
          <div className="space-y-3 bg-rose-50/70 border border-rose-200 p-4 rounded-2xl animate-fadeIn">
            <label className="block text-xs font-bold text-rose-900">
              Reason for Rejection <span className="text-rose-600 font-normal">(Optional but helpful for student)</span>
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Inaudible sound, background noise, or missing introductory 10 minutes..."
              rows={2}
              className="w-full px-3 py-2 bg-white border border-rose-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 transition"
            />
            <div className="flex items-center justify-end space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setShowRejectForm(false)}
                disabled={isSubmitting}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 transition"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={isSubmitting}
                className="inline-flex items-center space-x-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition"
              >
                <XCircle className="w-4 h-4" />
                <span>{isSubmitting ? 'Rejecting...' : 'Confirm Rejection'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowRejectForm(true)}
              disabled={isSubmitting}
              className="inline-flex items-center space-x-1.5 px-4 py-2 border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              <XCircle className="w-4 h-4" />
              <span>Reject Recording</span>
            </button>

            <button
              type="button"
              onClick={handleApprove}
              disabled={isSubmitting}
              className="inline-flex items-center space-x-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Approving...' : 'Approve & Publish'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

