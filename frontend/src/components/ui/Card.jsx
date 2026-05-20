import React from 'react';

const Card = ({ children, className = '', hover = false, ...props }) => (
  <div
    className={`bg-white rounded-2xl shadow-sm border border-slate-100/80 overflow-hidden ${
      hover ? 'hover:shadow-md hover:border-teal/20 transition-all duration-200' : ''
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
