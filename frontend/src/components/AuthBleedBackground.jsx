/** Full-viewport teal/lime bleed behind auth pages */
const AuthBleedBackground = () => (
  <div className="auth-bleed fixed inset-0 -z-10 pointer-events-none overflow-hidden" aria-hidden>
    <div className="absolute inset-0 landing-bleed-gradient" />
    <div className="absolute inset-0 dna-pattern opacity-50" />
    <div className="absolute inset-0 dot-grid opacity-[0.35]" />
    <div className="absolute -top-24 -left-16 w-[min(28rem,70vw)] h-[min(28rem,55vh)] rounded-full bg-teal/14 blur-3xl" />
    <div className="absolute top-[35%] right-[5%] w-72 h-72 rounded-full bg-lime/12 blur-3xl" />
    <div className="absolute bottom-0 left-[20%] w-96 h-96 rounded-full bg-teal/10 blur-3xl" />
  </div>
);

export default AuthBleedBackground;
