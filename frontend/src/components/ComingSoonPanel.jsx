import { Link } from 'react-router-dom';
import { Clock, MapPin } from 'lucide-react';
import Button from './ui/Button';

/**
 * Full-area "coming soon" overlay with blurred decorative background.
 */
export default function ComingSoonPanel({
  title = 'Coming soon',
  subtitle,
  icon: Icon = MapPin,
  backTo = '/dashboard',
  backLabel = 'Back to dashboard',
  accent = 'amber',
}) {
  const accentRings = {
    amber: 'border-amber/30 bg-amber/10 text-amber-dark',
    teal: 'border-teal/30 bg-teal/10 text-teal-dark',
    lime: 'border-lime/30 bg-lime/10 text-lime-dark',
    violet: 'border-violet/30 bg-violet/10 text-violet-700',
    indigo: 'border-indigo/30 bg-indigo/10 text-indigo-700',
  };
  const accentRing = accentRings[accent] || accentRings.amber;

  const blobA = {
    amber: 'bg-amber/20',
    teal: 'bg-teal/20',
    lime: 'bg-lime/20',
    violet: 'bg-violet/20',
    indigo: 'bg-indigo/20',
  }[accent] || 'bg-amber/20';

  const blobB = {
    amber: 'bg-teal/15',
    teal: 'bg-lime/15',
    lime: 'bg-teal/15',
    violet: 'bg-teal/10',
    indigo: 'bg-teal/10',
  }[accent] || 'bg-teal/15';

  return (
    <div className="dash-light-panel relative min-h-[min(28rem,70vh)] rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-600/50">
      {/* Blurred faux UI behind */}
      <div className="absolute inset-0 pointer-events-none select-none" aria-hidden>
        <div className="absolute inset-0 dna-pattern opacity-40" />
        <div className={`absolute -top-16 -right-12 w-72 h-72 rounded-full blur-3xl ${blobA}`} />
        <div className={`absolute bottom-0 left-1/4 w-80 h-80 rounded-full blur-3xl ${blobB}`} />
        <div className="absolute inset-4 sm:inset-8 space-y-4 blur-md opacity-60">
          <div className="h-10 w-2/3 rounded-xl bg-white/80" />
          <div className="h-24 rounded-2xl bg-white/70 border border-slate-200/60" />
          <div className="h-16 rounded-xl bg-white/60" />
          <div className="h-16 rounded-xl bg-white/60" />
          <div className="h-16 rounded-xl bg-white/60 w-4/5" />
        </div>
      </div>

      {/* Frosted overlay */}
      <div className="absolute inset-0 bg-white/70 dark:bg-white/75 backdrop-blur-md" aria-hidden />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-16 sm:py-20">
        <span
          className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl border ${accentRing} mb-5`}
        >
          <Icon size={28} strokeWidth={1.75} />
        </span>
        <p className="text-xs font-bold uppercase tracking-widest text-muted mb-2">MedMx LABS</p>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight">{title}</h2>
        {subtitle ? (
          <p className="mt-3 text-sm sm:text-base text-muted max-w-md leading-relaxed">{subtitle}</p>
        ) : null}
        <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-muted">
          <Clock size={16} className="shrink-0" />
          <span>We&apos;re building this feature</span>
        </div>
        <Link to={backTo} className="mt-8">
          <Button variant="primary" size="md">
            {backLabel}
          </Button>
        </Link>
      </div>
    </div>
  );
}
