/** Gradient divider between OAuth and email form */
export default function AuthDivider({ label = 'or continue with email' }) {
  return (
    <div className="flex items-center gap-3 my-4" role="separator">
      <div className="auth-divider-line flex-1" />
      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 shrink-0 px-1">
        {label}
      </span>
      <div className="auth-divider-line flex-1" />
    </div>
  );
}
