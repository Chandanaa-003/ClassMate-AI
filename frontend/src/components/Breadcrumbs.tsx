import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
  active?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  return (
    <nav className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
      <button
        onClick={items[0]?.onClick}
        className="flex items-center hover:text-indigo-600 transition cursor-pointer"
        title="Dashboard"
      >
        <Home className="w-3.5 h-3.5" />
      </button>

      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
          {item.active || !item.onClick ? (
            <span className="font-semibold text-slate-800 truncate max-w-[200px] sm:max-w-xs">
              {item.label}
            </span>
          ) : (
            <button
              onClick={item.onClick}
              className="hover:text-indigo-600 transition cursor-pointer truncate max-w-[150px] sm:max-w-[200px]"
            >
              {item.label}
            </button>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

