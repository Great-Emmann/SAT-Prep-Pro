import React, { useState } from "react";
import { ChevronDown, ChevronUp, LucideIcon } from "lucide-react";

interface WidgetCardProps {
  id?: string;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  badge?: {
    text: string;
    color?: string;
  };
  actions?: React.ReactNode;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  className?: string;
  headerClassName?: string;
}

export function WidgetCard({
  id,
  title,
  subtitle,
  icon: Icon,
  badge,
  actions,
  children,
  collapsible = true,
  defaultCollapsed = false,
  className = "",
  headerClassName = ""
}: WidgetCardProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  return (
    <div
      id={id}
      className={`bg-white rounded-xl border border-slate-200/90 shadow-xs transition-all duration-200 hover:shadow-sm overflow-hidden flex flex-col ${className}`}
    >
      {/* Widget Header */}
      <div
        className={`px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/60 ${headerClassName}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {Icon && (
            <div className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-100/80 text-indigo-600 shrink-0">
              <Icon size={15} />
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xs font-black text-slate-700 uppercase tracking-wider truncate">
                {title}
              </h2>
              {badge && (
                <span
                  className={`px-2 py-0.5 text-[9px] font-black rounded uppercase tracking-wider ${
                    badge.color || "bg-indigo-50 text-indigo-700 border border-indigo-200"
                  }`}
                >
                  {badge.text}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Header Actions & Collapse Toggle */}
        <div className="flex items-center gap-1.5 shrink-0">
          {actions}
          {collapsible && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-all cursor-pointer"
              title={isCollapsed ? "Expand Widget" : "Collapse Widget"}
            >
              {isCollapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
            </button>
          )}
        </div>
      </div>

      {/* Widget Body */}
      {!isCollapsed && <div className="p-4 flex-1">{children}</div>}
    </div>
  );
}
