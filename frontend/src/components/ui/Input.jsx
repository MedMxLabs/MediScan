import React from 'react';

const Input = React.forwardRef(({ label, error, icon: Icon, className = '', ...props }, ref) => (
  <div className={`w-full ${className}`}>
    {label && <label className="block text-sm font-semibold text-navy mb-1.5 ml-0.5">{label}</label>}
    <div className="relative">
      {Icon && (
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
          <Icon size={18} />
        </div>
      )}
      <input
        ref={ref}
        className={`block w-full rounded-xl border bg-white shadow-sm sm:text-sm py-3 px-4 transition-all
          ${Icon ? 'pl-11' : ''}
          ${error
            ? 'border-red-300 text-red-900 focus:ring-red-500/20 focus:border-red-400'
            : 'border-slate-200 text-navy placeholder:text-slate-400 focus:ring-teal/20 focus:border-teal'}
        `}
        {...props}
      />
    </div>
    {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
  </div>
));

Input.displayName = 'Input';

export default Input;
