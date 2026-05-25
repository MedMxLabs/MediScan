

/** Consistent max-width and spacing for dashboard routes */
const PageShell = ({ children, className = '' }) => (
  <div className={`max-w-7xl mx-auto space-y-6 pb-8 ${className}`}>{children}</div>
);

export default PageShell;
