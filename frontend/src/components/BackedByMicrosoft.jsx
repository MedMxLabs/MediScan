/** "Backed by Microsoft" trust badge for Azure / Microsoft for Startups positioning */

const MicrosoftMark = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 23 23"
    aria-hidden
    className="shrink-0"
  >
    <rect x="1" y="1" width="10" height="10" fill="#F25022" />
    <rect x="12" y="1" width="10" height="10" fill="#7FBA00" />
    <rect x="1" y="12" width="10" height="10" fill="#00A4EF" />
    <rect x="12" y="12" width="10" height="10" fill="#FFB900" />
  </svg>
);

const BackedByMicrosoft = ({
  variant = 'light',
  className = '',
  compact = false,
  pill = false,
}) => {
  const isDark = variant === 'dark';

  if (pill) {
    return (
      <div
        className={`inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white/90 border border-[#0078d4]/30 text-xs font-bold uppercase tracking-wider text-[#0078d4] shadow-sm ${className}`}
        title="Hosted on Microsoft Azure"
      >
        <MicrosoftMark size={14} />
        <span>Backed by Microsoft</span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2 ${compact ? 'text-[11px]' : 'text-xs'} ${
        isDark ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'
      } ${className}`}
      title="Hosted on Microsoft Azure"
    >
      <MicrosoftMark size={compact ? 14 : 16} />
      <span className="font-medium tracking-wide">Backed by Microsoft</span>
    </div>
  );
};

export default BackedByMicrosoft;
