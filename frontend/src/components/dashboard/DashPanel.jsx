

const DashPanel = ({
  title,
  action,
  children,
  className = '',
  bodyClassName = '',
  noPadding = false,
  lightSurface = false,
}) => (
  <section
    className={`dash-surface rounded-2xl shadow-sm overflow-hidden ${lightSurface ? 'dash-light-panel' : ''} ${className}`}
  >
    {title && (
      <div
        className={`px-5 sm:px-6 py-4 border-b flex flex-wrap items-center justify-between gap-3 ${
          lightSurface ? 'border-slate-100' : 'border-slate-100 dark:border-slate-700'
        }`}
      >
        <h2
          className={`text-sm sm:text-[15px] font-bold ${lightSurface ? 'text-navy' : 'dash-text'}`}
        >
          {title}
        </h2>
        {action}
      </div>
    )}
    <div className={noPadding ? bodyClassName : `p-5 sm:p-6 ${bodyClassName}`}>{children}</div>
  </section>
);

export default DashPanel;
