import React, { useState } from 'react';
import { Classroom } from '../types/classroom';
import { Users, Copy, Check, BookOpen, ArrowRight } from 'lucide-react';

interface ClassroomCardProps {
  classroom: Classroom;
  onSelect: (classroomId: number) => void;
  showCode?: boolean;
}

export const ClassroomCard: React.FC<ClassroomCardProps> = ({
  classroom,
  onSelect,
  showCode = false,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(classroom.join_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      onClick={() => onSelect(classroom.id)}
      className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer flex flex-col justify-between group"
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <BookOpen className="w-5 h-5" />
          </div>

          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
              <Users className="w-3.5 h-3.5 text-slate-500 mr-1" />
              <span>{classroom.member_count} {classroom.member_count === 1 ? 'student' : 'students'}</span>
            </span>
          </div>
        </div>

        <h3 className="text-base font-bold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-1">
          {classroom.name}
        </h3>

        <p className="text-xs text-slate-500 mt-1 line-clamp-2 min-h-[2rem]">
          {classroom.description || 'No description provided.'}
        </p>

        <div className="mt-3 text-xs text-slate-400">
          Instructor: <span className="text-slate-600 font-medium">{classroom.lecturer_name}</span>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
        {showCode ? (
          <div className="flex items-center space-x-2">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Join Code:</span>
            <button
              onClick={handleCopyCode}
              title="Click to copy join code"
              className="inline-flex items-center space-x-1.5 px-2.5 py-1 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg text-xs font-mono font-bold text-indigo-700 transition cursor-pointer"
            >
              <span>{classroom.join_code}</span>
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600" />
              )}
            </button>
          </div>
        ) : (
          <span className="text-xs font-medium text-emerald-600">Enrolled Member</span>
        )}

        <div className="inline-flex items-center text-xs font-semibold text-indigo-600 group-hover:translate-x-1 transition-transform">
          <span>Enter</span>
          <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </div>
      </div>
    </div>
  );
};

