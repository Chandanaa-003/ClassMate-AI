import React, { useState } from 'react';
import { uploadLecture } from '../services/lecture';
import { UserRole } from '../types/auth';
import { UploadCloud, X, AlertCircle, FileAudio, CheckCircle2, Music } from 'lucide-react';

interface UploadLectureModalProps {
  token: string;
  subjectId: number;
  userRole: UserRole;
  isOpen: boolean;
  onClose: () => void;
  onLectureUploaded: () => void;
}

const ALLOWED_EXTENSIONS = ['.mp3', '.wav', '.webm', '.m4a', '.ogg', '.aac', '.mp4'];
const MAX_FILE_SIZE_MB = 50;

export const UploadLectureModal: React.FC<UploadLectureModalProps> = ({
  token,
  subjectId,
  userRole,
  isOpen,
  onClose,
  onLectureUploaded,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [autoApprove, setAutoApprove] = useState(userRole === 'lecturer');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setFile(null);
    setDuration(null);
    setTitle('');
    setDescription('');
    setError(null);
    onClose();
  };

  const handleFileChange = (selectedFile: File) => {
    setError(null);

    // Validate extension
    const ext = '.' + selectedFile.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setError(`Invalid format '${ext}'. Allowed audio formats: ${ALLOWED_EXTENSIONS.join(', ')}`);
      return;
    }

    // Validate size
    if (selectedFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`File size exceeds ${MAX_FILE_SIZE_MB}MB limit.`);
      return;
    }

    setFile(selectedFile);
    if (!title) {
      // Suggest title from file name without extension
      const defaultTitle = selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setTitle(defaultTitle);
    }

    // Calculate duration using audio element
    try {
      const audio = new Audio();
      audio.src = URL.createObjectURL(selectedFile);
      audio.onloadedmetadata = () => {
        if (audio.duration && !isNaN(audio.duration)) {
          setDuration(audio.duration);
        }
      };
    } catch {
      // Ignore duration calculation failure
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select an audio file to upload.');
      return;
    }
    if (!title.trim()) {
      setError('Please provide a title for the lecture.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title.trim());
      if (description.trim()) {
        formData.append('description', description.trim());
      }
      if (duration) {
        formData.append('duration', duration.toString());
      }
      if (userRole === 'lecturer' && autoApprove) {
        formData.append('status', 'APPROVED');
      }

      await uploadLecture(token, subjectId, formData);
      onLectureUploaded();
      handleClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to upload lecture.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Upload Lecture Audio</h3>
              <p className="text-xs text-slate-500">Upload MP3, WAV, WebM, OGG, or M4A audio files</p>
            </div>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Dropzone */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Select Audio File <span className="text-rose-500">*</span>
            </label>
            <div className="relative border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-6 text-center transition bg-slate-50/50 hover:bg-indigo-50/30">
              <input
                type="file"
                accept=".mp3,.wav,.webm,.m4a,.ogg,.aac"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {file ? (
                <div className="flex items-center justify-center space-x-3 text-left">
                  <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
                    <Music className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 truncate max-w-xs">{file.name}</p>
                    <p className="text-[11px] text-slate-500">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB {duration ? `• ~${Math.round(duration)}s` : ''}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="mx-auto w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                    <FileAudio className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-700">
                    Click to browse or drag & drop audio here
                  </p>
                  <p className="text-[11px] text-slate-400">
                    MP3, WAV, WebM, M4A up to {MAX_FILE_SIZE_MB}MB
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Lecture Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Week 3: Dynamic Programming & Memoization"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Description <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Summary of lecture contents, chapter topics, or instructions..."
              rows={3}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
            />
          </div>

          {userRole === 'lecturer' ? (
            <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={autoApprove}
                onChange={(e) => setAutoApprove(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
              />
              <span>Auto-approve & publish immediately to lecture library</span>
            </label>
          ) : (
            <p className="text-[11px] text-slate-500 flex items-center space-x-1.5 pt-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Student uploads will be reviewed by the lecturer before appearing in the class library.</span>
            </p>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              disabled={isUploading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isUploading || !file || !title.trim()}
              className="inline-flex items-center space-x-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 transition disabled:opacity-50 cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{isUploading ? 'Uploading...' : 'Upload Lecture'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

