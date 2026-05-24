import React from 'react';

const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center text-center py-10 px-4">
    {Icon && (
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-muted mb-4">
        <Icon size={24} strokeWidth={1.5} />
      </span>
    )}
    {title && <p className="text-base font-bold text-navy">{title}</p>}
    {description && <p className="text-sm text-muted mt-2 max-w-sm leading-relaxed">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export default EmptyState;
