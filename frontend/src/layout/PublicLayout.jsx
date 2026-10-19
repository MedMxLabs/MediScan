import { Suspense } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Logo from '../components/Logo';
import Button from '../components/ui/Button';
import BackedByMicrosoft from '../components/BackedByMicrosoft';
import BleedBackground from '../components/BleedBackground';
import LoadingState from '../components/dashboard/LoadingState';

const ACCENT_BAR = {
  teal: 'border-b-teal/25',
  lime: 'border-b-lime/30',
  indigo: 'border-b-indigo/25',
  violet: 'border-b-violet/25',
  amber: 'border-b-amber/30',
};

/** Public feature pages — landing bleed + per-route accent, always readable (light-shell) */
export default function PublicLayout({ children, title, accent = 'teal' }) {
  const isAuthenticated = useSelector((s) => s.auth.isAuthenticated);
  const accentBar = ACCENT_BAR[accent] || ACCENT_BAR.teal;

  return (
    <div
      className={`min-h-screen light-shell public-shell public-shell--${accent} relative`}
      data-accent={accent}
    >
      <BleedBackground variant="public" accent={accent} />
      <div className="relative z-0 flex min-h-screen flex-col">
        <header
          className={`sticky top-0 z-40 border-b-2 bg-white/75 backdrop-blur-md ${accentBar} shadow-sm`}
        >
          <div className="layout-wide flex items-center justify-between gap-4 py-3 px-4 sm:px-6">
            <Logo to="/" size="sm" theme="on-light" />
            <div className="flex items-center gap-2 sm:gap-3">
              {title ? (
                <span className="hidden sm:inline text-sm font-semibold text-navy">{title}</span>
              ) : null}
              {isAuthenticated ? (
                <Link to="/dashboard">
                  <Button variant="primary" size="sm">
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/login" className="text-sm font-semibold text-muted hover:text-teal">
                    Log in
                  </Link>
                  <Link to="/signup">
                    <Button variant="primary" size="sm">
                      Sign up
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>
        <main className="layout-wide flex-1 px-4 sm:px-6 py-6 sm:py-8">
          <Suspense fallback={<LoadingState />}>{children}</Suspense>
        </main>
        <footer className="layout-wide px-4 sm:px-6 py-6 border-t border-slate-200/60 flex justify-center bg-white/40 backdrop-blur-sm">
          <BackedByMicrosoft />
        </footer>
      </div>
    </div>
  );
}
