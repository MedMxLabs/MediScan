

const Card = ({ children, className = '', hover = false, ...props }) => (
  <div
    className={`dash-surface rounded-2xl shadow-sm overflow-hidden ${
      hover ? 'hover-lift hover:border-teal/25 dark:hover:border-teal/40 hover:shadow-md transition-all duration-300' : ''
    } ${className}`}
    {...props}
  >
    {children}
  </div>
);

Card.Header = ({ children, className = '' }) => (
  <div className={`px-6 py-4 border-b border-slate-100 dark:border-slate-700 ${className}`}>{children}</div>
);

Card.Body = ({ children, className = '' }) => <div className={`p-6 ${className}`}>{children}</div>;

export default Card;
