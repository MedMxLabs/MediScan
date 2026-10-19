

const LoadingState = ({ label = 'Loading…' }) => (
  <div className="flex flex-col items-center justify-center min-h-[16rem] gap-3" role="status" aria-live="polite">
    <div className="h-10 w-10 rounded-full border-2 border-teal/20 border-t-teal animate-spin" aria-hidden />
    <p className="text-sm font-medium dash-muted">{label}</p>
  </div>
);

export default LoadingState;
