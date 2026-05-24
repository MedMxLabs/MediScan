import React from 'react';

const Card = ({ children, className = '', hover = false, ...props }) => (
  <div
    className={`rounded-2xl border border-slate-200/90 bg-white/95 backdrop-blur-sm shadow-sm overflow-hidden ${
      hover ? 'hover-lift hover:border-teal/25 hover:shadow-md transition-all duration-300' : ''
    } ${className}`}
    {...props}
  >
    {children}
  </div>
);

Card.Header = ({ children, className = '' }) => (
  <div className={`px-6 py-4 border-b border-slate-100 ${className}`}>{children}</div>
);

Card.Body = ({ children, className = '' }) => <div className={`p-6 ${className}`}>{children}</div>;

Card.Footer = ({ children, className = '' }) => (
  <div className={`px-6 py-4 border-t border-slate-100 bg-slate-50/80 ${className}`}>{children}</div>
);

export default Card;
