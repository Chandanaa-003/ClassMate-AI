import React, { useEffect, useRef, useState } from 'react';
import { uploadLecture } from '../services/lecture';
import { UserRole } from '../types/auth';
import {
  Mic,
  Square,
  Pause,
  Play,
  RotateCcw,
  Upload,
  X,
  AlertCircle,
  CheckCircle2,
  Volume2,
  ShieldCheck,
  Radio,
} from 'lucide-react';

interface RecordLectureModalProps {
  token: string;
  subjectId: number;
  userRole: UserRole;
  isOpen: boolean;
  onClose: () => void;
  onLectureCreated: () => void;
}

type RecordState = 'idle' | 'recording' | 'paused' | 'stopped';

export const RecordLectureModal: React.FC<RecordLectureModalProps> = ({
  token,
  subjectId,
  userRole,
  isOpen,
  onClose,
  onLectureCreated,
}) => {
  const [recordState, setRecordState] = useState<RecordState>('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [hasConsent, setHasConsent] = useState(false);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [autoApprove, setAutoApprove] = useState(userRole === 'lecturer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  // Cleanup on unmount or close
  useEffect(() => {
    return () => {
      cleanupStreams();
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, []);

  const cleanupStreams = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  };

  const handleClose = () => {
    cleanupStreams();
    setRecordState('idle');
    setElapsedSeconds(0);
    setAudioBlob(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setTitle('');
    setDescription('');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  const startRecording = async () => {
    setError(null);
    if (!hasConsent) {
      setError('Please acknowledge classroom permission and recording consent before starting.');
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Your browser does not support audio recording. Please upload an audio file instead.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // Select supported audio mime type
      const possibleTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
        'audio/wav',
      ];
      let selectedMime = '';
      for (const t of possibleTypes) {
        if (MediaRecorder.isTypeSupported(t)) {
          selectedMime = t;
          break;
        }
      }

      const options = selectedMime ? { mimeType: selectedMime } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const mime = selectedMime || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: mime });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
      };

      mediaRecorder.start(250); // collect every 250ms
      setRecordState('recording');
      setElapsedSeconds(0);

      timerRef.current = window.setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError('Microphone permission was denied. Please allow microphone access in your browser settings.');
        } else if (err.name === 'NotFoundError') {
          setError('No microphone device was detected on your system.');
        } else {
          setError(err.message || 'Failed to start recording.');
        }
      } else {
        setError('An unexpected error occurred while requesting microphone access.');
      }
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setRecordState('paused');
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setRecordState('recording');
      timerRef.current = window.setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setRecordState('stopped');
    }
  };

  const resetRecording = () => {
    cleanupStreams();
    setRecordState('idle');
    setElapsedSeconds(0);
    setAudioBlob(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioBlob) {
      setError('No audio recording found.');
      return;
    }
    if (!title.trim()) {
      setError('Please provide a title for the lecture recording.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const ext = audioBlob.type.includes('ogg') ? 'ogg' : audioBlob.type.includes('mp4') ? 'm4a' : 'webm';
      const file = new File([audioBlob], `lecture_record_${Date.now()}.${ext}`, {
        type: audioBlob.type || 'audio/webm',
      });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title.trim());
      if (description.trim()) {
        formData.append('description', description.trim());
      }
      formData.append('duration', elapsedSeconds.toString());
      if (userRole === 'lecturer' && autoApprove) {
        formData.append('status', 'APPROVED');
      }

      await uploadLecture(token, subjectId, formData);
      onLectureCreated();
      handleClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to upload lecture recording.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Record Lecture Audio</h3>
              <p className="text-xs text-slate-500">Record in real-time from your microphone</p>
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

        {/* Consent Section (Required before recording) */}
        {recordState === 'idle' && (
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center space-x-2 text-amber-800 font-semibold text-xs">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>Classroom Permission & Consent</span>
            </div>
            <p className="text-[11px] text-amber-700 leading-relaxed">
              Recording must strictly comply with classroom policies. Ensure you have instructor authorization and
              participant consent before capturing lecture audio.
            </p>
            <label className="flex items-center space-x-2 cursor-pointer text-xs font-medium text-slate-800">
              <input
                type="checkbox"
                checked={hasConsent}
                onChange={(e) => setHasConsent(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300 cursor-pointer"
              />
              <span>I confirm I have permission and consent to record this session.</span>
            </label>
          </div>
        )}

        {/* Recording Visualizer & Controls */}
        <div className="bg-slate-900 rounded-3xl p-6 text-white text-center space-y-4 shadow-inner">
          <div className="flex items-center justify-center space-x-2">
            {recordState === 'recording' && (
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping mr-1" />
            )}
            <span className="text-3xl sm:text-4xl font-extrabold font-mono tracking-wider">
              {formatTimer(elapsedSeconds)}
            </span>
          </div>

          <div className="text-xs text-slate-400 font-medium capitalize">
            {recordState === 'idle' && 'Ready to record'}
            {recordState === 'recording' && 'Recording in progress...'}
            {recordState === 'paused' && 'Recording paused'}
            {recordState === 'stopped' && 'Recording completed'}
          </div>

          {/* Action Buttons based on Record State */}
          <div className="flex items-center justify-center gap-3 pt-2">
            {recordState === 'idle' && (
              <button
                type="button"
                onClick={startRecording}
                disabled={!hasConsent}
                className={`inline-flex items-center space-x-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition shadow-lg cursor-pointer ${
                  hasConsent
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Mic className="w-4 h-4" />
                <span>Start Recording</span>
              </button>
            )}

            {recordState === 'recording' && (
              <>
                <button
                  type="button"
                  onClick={pauseRecording}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition"
                >
                  <Pause className="w-4 h-4" />
                  <span>Pause</span>
                </button>
                <button
                  type="button"
                  onClick={stopRecording}
                  className="inline-flex items-center space-x-1.5 px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-600/30 transition"
                >
                  <Square className="w-4 h-4 fill-white" />
                  <span>Stop & Save</span>
                </button>
              </>
            )}

            {recordState === 'paused' && (
              <>
                <button
                  type="button"
                  onClick={resumeRecording}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition"
                >
                  <Play className="w-4 h-4 ml-0.5" />
                  <span>Resume</span>
                </button>
                <button
                  type="button"
                  onClick={stopRecording}
                  className="inline-flex items-center space-x-1.5 px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition"
                >
                  <Square className="w-4 h-4 fill-white" />
                  <span>Stop</span>
                </button>
              </>
            )}

            {recordState === 'stopped' && (
              <button
                type="button"
                onClick={resetRecording}
                className="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Discard & Re-record</span>
              </button>
            )}
          </div>
        </div>

        {/* Audio Preview & Metadata Form (Visible after stopping) */}
        {recordState === 'stopped' && previewUrl && (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2">
              <span className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5">
                <Volume2 className="w-4 h-4 text-indigo-600" />
                <span>Audio Preview</span>
              </span>
              <audio src={previewUrl} controls className="w-full h-8" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Lecture Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Chapter 4: Photosynthesis & Calvin Cycle"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Description <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Key topics discussed, slide references, exam tips..."
                rows={2}
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
              <p className="text-[11px] text-slate-500 flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Student recording will be submitted for lecturer review before appearing in the class library.</span>
              </p>
            )}

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !title.trim()}
                className="inline-flex items-center space-x-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 transition disabled:opacity-50 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>{isSubmitting ? 'Uploading...' : 'Save & Upload'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

