import React from 'react';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  fullWidth = false,
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:pointer-events-none hover:scale-[1.02] active:scale-[0.98] max-sm:min-h-[44px]';

  const variants = {
    primary:
      'bg-brand-gradient text-white hover:opacity-95 focus:ring-teal shadow-brand',
    secondary:
      'bg-brand-gradient-soft text-navy hover:bg-teal/10 focus:ring-teal border border-teal/20',
    outline:
      'border border-slate-200 text-navy bg-white hover:border-teal/40 hover:bg-teal/5 focus:ring-teal',
    outlineOnDark:
      'border border-white/35 bg-transparent text-white hover:border-white/50 hover:bg-white/10 focus:ring-teal focus:ring-offset-2 focus:ring-offset-navy',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    ghost: 'text-muted hover:bg-slate-100 focus:ring-slate-400',
    navy: 'bg-navy text-white hover:bg-navy-light focus:ring-navy',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3.5 text-base',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
