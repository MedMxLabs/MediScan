import AuthBleedBackground from './AuthBleedBackground';

/** Wraps auth routes (login, signup, forgot, reset) — bleed + readable contrast */
export default function AuthPageShell({ children, className = '' }) {
  return (
    <div
      className={`auth-shell h-[100dvh] max-h-[100dvh] overflow-hidden flex light-shell relative ${className}`.trim()}
    >
      <AuthBleedBackground />
      <div className="relative z-0 flex h-full w-full justify-center overflow-hidden">{children}</div>
    </div>
  );
}