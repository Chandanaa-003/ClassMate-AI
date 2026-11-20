import React from 'react';
import { Subject } from '../types/subject';
import { BookOpen, Edit2, Trash2, ArrowRight } from 'lucide-react';

interface SubjectCardProps {
  subject: Subject;
  onSelect: (subjectId: number) => void;
  onEdit?: (subject: Subject) => void;
  onDelete?: (subjectId: number, subjectName: string) => void;
  isLecturer?: boolean;
}

export const SubjectCard: React.FC<SubjectCardProps> = ({
  subject,
  onSelect,
  onEdit,
  onDelete,
  isLecturer = false,
}) => {
  return (
    <div
      onClick={() => onSelect(subject.id)}
      className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer flex flex-col justify-between group"
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="p-2.5 bg-violet-50 text-violet-600 rounded-xl group-hover:bg-violet-600 group-hover:text-white transition-colors">
            <BookOpen className="w-5 h-5" />
          </div>

          <div className="flex items-center space-x-1.5">
            {subject.code && (
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md font-mono text-xs font-bold">
                {subject.code}
              </span>
            )}
            {isLecturer && (
              <div className="flex items-center space-x-1 pl-1">
                {onEdit && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(subject);
                    }}
                    title="Edit Subject"
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(subject.id, subject.name);
                    }}
                    title="Delete Subject"
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <h4 className="text-base font-bold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-1">
          {subject.name}
        </h4>

        <p className="text-xs text-slate-500 mt-1 line-clamp-2 min-h-[2rem]">
          {subject.description || 'No description provided.'}
        </p>
      </div>

      <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-slate-400 text-[11px]">
          By <strong className="text-slate-600 font-medium">{subject.creator_name}</strong>
        </span>

        <div className="inline-flex items-center font-semibold text-indigo-600 group-hover:translate-x-1 transition-transform">
          <span>View</span>
          <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </div>
      </div>
    </div>
  );
};

