import React from 'react';
import { Doubt } from '../types/doubt';
import {
  MessageSquare,
  CheckCircle2,
  Clock,
  ShieldAlert,
  User,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';

interface DoubtCardProps {
  doubt: Doubt;
  onSelect: (doubtId: number) => void;
}

export const DoubtCard: React.FC<DoubtCardProps> = ({ doubt, onSelect }) => {
  const isResolved = doubt.status === 'resolved';

  return (
    <div
      onClick={() => onSelect(doubt.id)}
      className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md hover:border-amber-300 transition-all cursor-pointer flex flex-col justify-between group"
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-2.5">
          {/* Status Badge */}
          <div className="flex items-center space-x-2">
            {isResolved ? (
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Resolved</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>Open</span>
              </span>
            )}

            {/* Anonymous or Named Author */}
            {doubt.is_anonymous ? (
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600">
                <ShieldAlert className="w-3 h-3 text-slate-500" />
                <span>{doubt.author_name}</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-indigo-50 text-indigo-700">
                <User className="w-3 h-3 text-indigo-500" />
                <span>{doubt.author_name}</span>
              </span>
            )}
          </div>

          <div className="inline-flex items-center space-x-1 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            <span>{new Date(doubt.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-slate-800 group-hover:text-amber-600 transition-colors line-clamp-2">
          {doubt.title}
        </h3>

        {/* Description snippet */}
        <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
          {doubt.description}
        </p>
      </div>

      <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="inline-flex items-center space-x-1.5 text-slate-600 font-medium">
          <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
          <span>
            {doubt.answer_count} {doubt.answer_count === 1 ? 'Answer' : 'Answers'}
          </span>
        </span>

        <div className="inline-flex items-center font-semibold text-amber-600 group-hover:translate-x-1 transition-transform">
          <span>View Thread</span>
          <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </div>
      </div>
    </div>
  );
};

