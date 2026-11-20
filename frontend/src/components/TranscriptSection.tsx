import React, { useEffect, useState } from 'react';
import { getLectureTranscript, transcribeLecture, updateLectureTranscript } from '../services/ai';
import { ProcessingStatus, Transcript } from '../types/ai';
import {
  FileText,
  Sparkles,
  Loader2,
  AlertCircle,
  RotateCcw,
  Edit2,
  Save,
  X,
  Play,
  Globe,
  CheckCircle2,
} from 'lucide-react';

interface TranscriptSectionProps {
  token: string;
  lectureId: number;
  canEdit: boolean;
  onSeek: (timeInSeconds: number) => void;
  onStatusChange?: (status: ProcessingStatus) => void;
}

export const TranscriptSection: React.FC<TranscriptSectionProps> = ({
  token,
  lectureId,
  canEdit,
  onSeek,
  onStatusChange,
}) => {
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [loading, setLoading] = useState(true);
  const [languageHint, setLanguageHint] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'segments' | 'text'>('segments');

  const fetchTranscript = async () => {
    try {
      const data = await getLectureTranscript(token, lectureId);
      setTranscript(data);
      if (data.transcript_text && !isEditing) {
        setEditText(data.transcript_text);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTranscript();
  }, [token, lectureId]);

  useEffect(() => {
    if (transcript?.status && onStatusChange) {
      onStatusChange(transcript.status);
    }
  }, [transcript?.status]);

  // Polling when PROCESSING
  useEffect(() => {
    if (transcript?.status === 'PROCESSING') {
      const interval = setInterval(() => {
        fetchTranscript();
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [transcript?.status, token, lectureId]);

  const handleStartTranscribe = async (forceRetry: boolean = false) => {
    setError(null);
    try {
      const pending = await transcribeLecture(token, lectureId, {
        force_retry: forceRetry,
        language: languageHint || undefined,
      });
      setTranscript(pending);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to start transcription.');
      }
    }
  };

  const handleSaveEdit = async () => {
    if (!editText.trim()) return;
    setSavingEdit(true);
    setError(null);
    try {
      const updated = await updateLectureTranscript(token, lectureId, editText.trim());
      setTranscript(updated);
      setIsEditing(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to update transcript.');
      }
    } finally {
      setSavingEdit(false);
    }
  };

  const formatTimestamp = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center space-x-2">
        <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
        <span>Loading transcript...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center space-x-2 p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* State: NOT STARTED */}
      {(!transcript || transcript.status === 'NOT_STARTED') && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-4">
          <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-2xl mx-auto flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h4 className="text-sm font-bold text-slate-800">No Transcript Generated Yet</h4>
            <p className="text-xs text-slate-500">
              Generate an accurate, punctuated AI transcript with timestamps for audio navigation.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 max-w-sm mx-auto pt-1">
            <select
              value={languageHint}
              onChange={(e) => setLanguageHint(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">Auto-Detect Language</option>
              <option value="en">English</option>
              <option value="kn">Kannada</option>
              <option value="kn-en (mixed)">Kannada-English (Mixed)</option>
            </select>

            <button
              onClick={() => handleStartTranscribe(false)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Transcribe with AI</span>
            </button>
          </div>
        </div>
      )}

      {/* State: PROCESSING */}
      {transcript?.status === 'PROCESSING' && (
        <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-6 text-center space-y-3">
          <div className="w-10 h-10 bg-indigo-600 text-white rounded-2xl mx-auto flex items-center justify-center animate-pulse">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
          <h4 className="text-sm font-bold text-indigo-900">AI Transcription in Progress</h4>
          <p className="text-xs text-indigo-700 max-w-sm mx-auto">
            Whisper is processing the audio recording, recognizing speech patterns, and structuring segment timestamps.
          </p>
        </div>
      )}

      {/* State: FAILED */}
      {transcript?.status === 'FAILED' && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center space-y-3">
          <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-2xl mx-auto flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-rose-900">Transcription Failed</h4>
          <p className="text-xs text-rose-700 max-w-sm mx-auto">
            {transcript.error_message || 'An error occurred during audio processing. Please retry.'}
          </p>
          <button
            onClick={() => handleStartTranscribe(true)}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retry Transcription</span>
          </button>
        </div>
      )}

      {/* State: COMPLETED */}
      {transcript?.status === 'COMPLETED' && (
        <div className="space-y-3">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" />
                <span>Transcript Ready</span>
              </span>

              {transcript.language && (
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
                  <Globe className="w-3 h-3 text-slate-400" />
                  <span className="capitalize">{transcript.language}</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {/* Segments vs Text Mode Toggle */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-[11px] font-semibold">
                <button
                  onClick={() => setViewMode('segments')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    viewMode === 'segments' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  Timestamps
                </button>
                <button
                  onClick={() => setViewMode('text')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    viewMode === 'text' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  Full Text
                </button>
              </div>

              {canEdit && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition"
                  title="Correct transcript"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
              )}

              <button
                onClick={() => handleStartTranscribe(true)}
                className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition"
                title="Re-run transcription"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Edit Mode */}
          {isEditing ? (
            <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-700">
                Correct Transcript Text:
              </label>
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={6}
                className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs leading-relaxed text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
              <div className="flex items-center justify-end space-x-2">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditText(transcript.transcript_text || '');
                  }}
                  disabled={savingEdit}
                  className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 transition"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={savingEdit || !editText.trim()}
                  className="inline-flex items-center space-x-1 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingEdit ? 'Saving...' : 'Save Transcript'}</span>
                </button>
              </div>
            </div>
          ) : viewMode === 'segments' && transcript.segments && transcript.segments.length > 0 ? (
            /* Segmented View with clickable timestamps */
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {transcript.segments.map((seg) => (
                <div
                  key={seg.id}
                  className="group flex items-start space-x-3 p-2.5 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-200"
                >
                  <button
                    onClick={() => onSeek(seg.start)}
                    className="shrink-0 flex items-center space-x-1 px-2 py-0.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-md text-[11px] font-mono font-bold transition cursor-pointer"
                    title={`Seek to ${formatTimestamp(seg.start)}`}
                  >
                    <Play className="w-2.5 h-2.5" />
                    <span>{formatTimestamp(seg.start)}</span>
                  </button>
                  <p className="text-xs text-slate-700 leading-relaxed pt-0.5">
                    {seg.text}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            /* Full Text View */
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto">
              {transcript.transcript_text}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
