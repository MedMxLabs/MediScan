

const accents = {
  navy: 'text-navy dark:text-slate-100',
  teal: 'text-teal-dark dark:text-teal',
  lime: 'text-lime-dark dark:text-lime',
};

const StatCard = ({ label, value, sub, accent = 'navy', icon: Icon, children, className = '' }) => (
  <div
    className={`dash-surface rounded-2xl p-5 sm:p-6 shadow-sm hover-lift flex flex-col justify-between min-h-[7.5rem] ${className}`}
  >
    <div className="flex items-start justify-between gap-2">
      <p className="text-xs sm:text-[13px] font-bold dash-muted uppercase tracking-wide">{label}</p>
      {Icon && (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal/10 dark:bg-teal/20 text-teal">
          <Icon size={16} />
        </span>
      )}
    </div>
    <div className="mt-3">
      <p className={`text-2xl sm:text-[2rem] font-extrabold leading-none tabular-nums ${accents[accent] || accents.navy}`}>
        {value}
      </p>
      {sub && <p className="text-xs sm:text-[13px] font-medium dash-muted mt-1.5">{sub}</p>}
      {children}
    </div>
  </div>
);

export default StatCard;
