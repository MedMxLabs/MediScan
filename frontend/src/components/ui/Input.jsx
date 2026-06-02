import React from 'react';

const Input = React.forwardRef(
  ({ label, error, icon: Icon, className = '', lightSurface = false, compact = false, ...props }, ref) => {
  const labelCls = lightSurface ? 'text-navy' : 'dash-text';
  const iconCls = lightSurface ? 'text-muted' : 'dash-muted';
  const fieldCls = lightSurface
    ? `border-slate-200 text-navy bg-white placeholder:text-slate-400 focus:ring-teal/20 focus:border-teal ${
        error ? 'border-red-300 text-red-900 focus:ring-red-500/20 focus:border-red-400' : ''
      }`
    : `bg-white dark:bg-slate-900/60 ${
        error
          ? 'border-red-300 dark:border-red-800 text-red-900 dark:text-red-200 focus:ring-red-500/20 focus:border-red-400'
          : 'border-slate-200 dark:border-slate-600 text-navy dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-teal/20 focus:border-teal'
      }`;

  const labelSize = compact ? 'text-xs mb-1' : 'text-sm mb-1.5';
  const fieldPad = compact ? 'py-2 px-3 text-sm' : 'py-3 px-4 sm:text-sm';

  return (
  <div className={`w-full ${className}`}>
    {label && <label className={`block font-semibold ${labelCls} ${labelSize} ml-0.5`}>{label}</label>}
    <div className="relative">
      {Icon && (
        <div className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none ${iconCls}`}>
          <Icon size={18} />
        </div>
      )}
      <input
        ref={ref}
        className={`block w-full rounded-xl border shadow-sm transition-all ${fieldPad} ${Icon ? 'pl-11' : ''} ${fieldCls}`}
        {...props}
      />
    </div>
    {error && <p className={`mt-1.5 text-sm text-red-600 ${lightSurface ? '' : 'dark:text-red-400'}`}>{error}</p>}
  </div>
  );
});

Input.displayName = 'Input';

export default Input;
