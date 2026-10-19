import BleedBackground from './BleedBackground';

/** Wraps auth routes (login, signup, forgot, reset) — bleed + readable contrast */
export default function AuthPageShell({ children, className = '' }) {
  return (
    <div
      className={`auth-shell h-[100dvh] max-h-[100dvh] overflow-hidden flex light-shell relative ${className}`.trim()}
    >
      <BleedBackground variant="auth" />
      <div className="relative z-0 flex h-full w-full justify-center overflow-hidden">{children}</div>
    </div>
  );
}