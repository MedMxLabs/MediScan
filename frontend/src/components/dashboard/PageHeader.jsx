import React from 'react';

const PageHeader = ({ title, subtitle, icon: Icon, action, className = '' }) => (
  <div className={`flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 ${className}`}>
    <div className="flex items-start gap-3 min-w-0">
      {Icon && (
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-brand">
          <Icon size={20} strokeWidth={2} />
        </span>
      )}
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-bold text-navy tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted mt-1 leading-relaxed">{subtitle}</p>}
      </div>
    </div>
    {action && <div className="shrink-0 flex flex-wrap gap-2">{action}</div>}
  </div>
);

export default PageHeader;
