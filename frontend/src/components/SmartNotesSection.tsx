import React, { useEffect, useState } from 'react';
import { generateLectureNotes, getLectureNotes } from '../services/ai';
import { ProcessingStatus, SmartNote } from '../types/ai';
import {
  Sparkles,
  BookOpen,
  Copy,
  Check,
  RotateCcw,
  AlertCircle,
  Loader2,
  FileText,
  Lightbulb,
  CheckSquare,
  HelpCircle,
  Tag,
  Zap,
} from 'lucide-react';

interface SmartNotesSectionProps {
  token: string;
  lectureId: number;
  transcriptStatus: ProcessingStatus;
}

export const SmartNotesSection: React.FC<SmartNotesSectionProps> = ({
  token,
  lectureId,
  transcriptStatus,
}) => {
  const [note, setNote] = useState<SmartNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchNotes = async () => {
    try {
      const data = await getLectureNotes(token, lectureId);
      setNote(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [token, lectureId]);

  // Polling when PROCESSING
  useEffect(() => {
    if (note?.status === 'PROCESSING') {
      const interval = setInterval(() => {
        fetchNotes();
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [note?.status, token, lectureId]);

  const handleGenerate = async (forceRetry: boolean = false) => {
    setError(null);
    try {
      const pending = await generateLectureNotes(token, lectureId, forceRetry);
      setNote(pending);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to generate smart notes.');
      }
    }
  };

  const handleCopyNotes = () => {
    if (!note?.content_markdown) return;
    navigator.clipboard.writeText(note.content_markdown).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center space-x-2">
        <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
        <span>Loading study notes...</span>
      </div>
    );
  }

  // Pre-condition: Transcript must be completed first
  if (transcriptStatus !== 'COMPLETED') {
    return (
      <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-6 text-center space-y-2">
        <FileText className="w-8 h-8 text-amber-500 mx-auto" />
        <h4 className="text-xs font-bold text-amber-900">Transcript Required First</h4>
        <p className="text-[11px] text-amber-700 max-w-sm mx-auto">
          Smart Notes are synthesized directly from speech transcripts. Please generate or complete the lecture transcript above.
        </p>
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
      {(!note || note.status === 'NOT_STARTED') && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-3">
          <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-2xl mx-auto flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h4 className="text-sm font-bold text-slate-800">Generate Structured Study Notes</h4>
            <p className="text-xs text-slate-500">
              Transform this lecture transcript into 9 organized study sections including key concepts, definitions, revision summary, and exam prep questions.
            </p>
          </div>
          <button
            onClick={() => handleGenerate(false)}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Smart Notes</span>
          </button>
        </div>
      )}

      {/* State: PROCESSING */}
      {note?.status === 'PROCESSING' && (
        <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-6 text-center space-y-3">
          <div className="w-10 h-10 bg-indigo-600 text-white rounded-2xl mx-auto flex items-center justify-center animate-pulse">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
          <h4 className="text-sm font-bold text-indigo-900">Synthesizing Smart Study Notes</h4>
          <p className="text-xs text-indigo-700 max-w-sm mx-auto">
            Extracting core definitions, structuring explanations, and formulating possible exam questions based strictly on the transcript.
          </p>
        </div>
      )}

      {/* State: FAILED */}
      {note?.status === 'FAILED' && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center space-y-3">
          <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-2xl mx-auto flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-rose-900">Notes Generation Failed</h4>
          <p className="text-xs text-rose-700 max-w-sm mx-auto">
            {note.error_message || 'Failed to synthesize notes. Please try again.'}
          </p>
          <button
            onClick={() => handleGenerate(true)}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retry Notes Generation</span>
          </button>
        </div>
      )}

      {/* State: COMPLETED */}
      {note?.status === 'COMPLETED' && note.sections && (
        <div className="space-y-4">
          {/* Header Action Bar */}
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <span className="text-xs font-bold text-indigo-900 flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>9-Section Structured Notes</span>
            </span>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopyNotes}
                className="inline-flex items-center space-x-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
                title="Copy formatted markdown to clipboard"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Notes'}</span>
              </button>

              <button
                onClick={() => handleGenerate(true)}
                className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition"
                title="Regenerate notes"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 1. Overview */}
          {note.sections.overview && (
            <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 space-y-1">
              <h5 className="text-xs font-extrabold text-indigo-900 flex items-center space-x-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                <span>1. Lecture Overview</span>
              </h5>
              <p className="text-xs text-indigo-950 leading-relaxed">{note.sections.overview}</p>
            </div>
          )}

          {/* 2. Important Concepts */}
          {note.sections.important_concepts && note.sections.important_concepts.length > 0 && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-2">
              <h5 className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                <span>2. Important Concepts</span>
              </h5>
              <ul className="space-y-1 text-xs text-slate-700 pl-4 list-disc">
                {note.sections.important_concepts.map((c, i) => (
                  <li key={i} className="leading-relaxed">{c}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 3. Topic-wise Explanations */}
          {note.sections.topic_explanations && note.sections.topic_explanations.length > 0 && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3">
              <h5 className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                <span>3. Topic-wise Explanations</span>
              </h5>
              <div className="space-y-2.5">
                {note.sections.topic_explanations.map((item, i) => {
                  const topic = typeof item === 'object' && item !== null ? item.topic : `Topic ${i + 1}`;
                  const explanation = typeof item === 'object' && item !== null ? item.explanation : String(item);
                  return (
                    <div key={i} className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                      <strong className="text-xs text-indigo-900 font-semibold">{topic}</strong>
                      <p className="text-xs text-slate-600 leading-relaxed">{explanation}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. Key Definitions */}
          {note.sections.key_definitions && note.sections.key_definitions.length > 0 && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-2.5">
              <h5 className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                <Tag className="w-3.5 h-3.5 text-emerald-600" />
                <span>4. Key Definitions</span>
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {note.sections.key_definitions.map((item, i) => {
                  const term = typeof item === 'object' && item !== null ? item.term : `Definition ${i + 1}`;
                  const def = typeof item === 'object' && item !== null ? item.definition : String(item);
                  return (
                    <div key={i} className="p-2.5 bg-emerald-50/50 border border-emerald-100 rounded-xl text-xs space-y-0.5">
                      <span className="font-bold text-emerald-900">{term}</span>
                      <p className="text-slate-600">{def}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 5. Important Points */}
          {note.sections.important_points && note.sections.important_points.length > 0 && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-2">
              <h5 className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
                <span>5. Important Points</span>
              </h5>
              <ul className="space-y-1 text-xs text-slate-700 pl-4 list-disc">
                {note.sections.important_points.map((p, i) => (
                  <li key={i} className="leading-relaxed">{p}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 6. Examples Mentioned in Lecture */}
          {note.sections.examples_mentioned && note.sections.examples_mentioned.length > 0 && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-2">
              <h5 className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                <BookOpen className="w-3.5 h-3.5 text-violet-600" />
                <span>6. Examples Mentioned in Lecture</span>
              </h5>
              <ul className="space-y-1 text-xs text-slate-600 pl-4 list-disc">
                {note.sections.examples_mentioned.map((ex, i) => (
                  <li key={i}>{ex}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 7. Important Keywords */}
          {note.sections.important_keywords && note.sections.important_keywords.length > 0 && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-2">
              <h5 className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <span>7. Important Keywords</span>
              </h5>
              <div className="flex flex-wrap gap-1.5">
                {note.sections.important_keywords.map((kw, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-md text-[11px] font-mono text-slate-700"
                  >
                    #{kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 8. Quick Revision Summary */}
          {note.sections.quick_revision_summary && (
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 space-y-1">
              <h5 className="text-xs font-extrabold text-amber-900 flex items-center space-x-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                <span>8. Quick Revision Summary</span>
              </h5>
              <p className="text-xs text-amber-950 leading-relaxed font-medium">
                {note.sections.quick_revision_summary}
              </p>
            </div>
          )}

          {/* 9. Possible Exam Questions */}
          {note.sections.possible_exam_questions && note.sections.possible_exam_questions.length > 0 && (
            <div className="bg-violet-50/60 border border-violet-100 rounded-2xl p-4 space-y-2">
              <h5 className="text-xs font-extrabold text-violet-900 flex items-center space-x-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-violet-600" />
                <span>9. Possible Exam Questions</span>
              </h5>
              <ol className="space-y-1 text-xs text-violet-950 pl-4 list-decimal font-medium">
                {note.sections.possible_exam_questions.map((q, i) => (
                  <li key={i} className="leading-relaxed">{q}</li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

