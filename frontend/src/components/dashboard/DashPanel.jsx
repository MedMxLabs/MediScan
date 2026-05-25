

const DashPanel = ({
  title,
  action,
  children,
  className = '',
  bodyClassName = '',
  noPadding = false,
}) => (
  <section
    className={`rounded-2xl border border-slate-200/90 bg-white/95 backdrop-blur-sm shadow-sm overflow-hidden ${className}`}
  >
    {title && (
      <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm sm:text-[15px] font-bold text-navy">{title}</h2>
        {action}
      </div>
    )}
    <div className={noPadding ? bodyClassName : `p-5 sm:p-6 ${bodyClassName}`}>{children}</div>
  </section>
);

export default DashPanel;
