/**
 * Landing-style teal → white → lime bleed for public feature pages.
 * `accent` shifts blob emphasis per route (search, upload, compare, etc.).
 */
const BLOB = {
  teal: {
    a: 'bg-teal/14',
    b: 'bg-lime/12',
    c: 'bg-teal/10',
    d: 'bg-lime/10',
    e: 'bg-teal/8',
  },
  lime: {
    a: 'bg-lime/16',
    b: 'bg-teal/12',
    c: 'bg-lime/11',
    d: 'bg-teal/10',
    e: 'bg-lime/9',
  },
  indigo: {
    a: 'bg-indigo/12',
    b: 'bg-teal/12',
    c: 'bg-indigo/10',
    d: 'bg-teal/10',
    e: 'bg-indigo/8',
  },
  violet: {
    a: 'bg-violet/12',
    b: 'bg-teal/11',
    c: 'bg-violet/10',
    d: 'bg-lime/10',
    e: 'bg-violet/8',
  },
  amber: {
    a: 'bg-amber/14',
    b: 'bg-teal/10',
    c: 'bg-amber/11',
    d: 'bg-lime/9',
    e: 'bg-amber/8',
  },
};

const PublicBleedBackground = ({ accent = 'teal' }) => {
  const c = BLOB[accent] || BLOB.teal;

  return (
    <div
      className="public-bleed fixed inset-0 -z-10 pointer-events-none overflow-hidden"
      aria-hidden
      data-accent={accent}
    >
      <div className="absolute inset-0 landing-bleed-gradient public-bleed-gradient" />
      <div className="absolute inset-0 dna-pattern opacity-55" />
      <div className="absolute inset-0 dot-grid opacity-30" />
      <div
        className={`absolute -top-24 -left-40 w-[min(36rem,90vw)] h-[min(36rem,70vh)] rounded-full blur-3xl ${c.a}`}
      />
      <div
        className={`absolute top-[22%] -right-32 w-[min(40rem,95vw)] h-[min(40rem,65vh)] rounded-full blur-3xl ${c.b}`}
      />
      <div
        className={`absolute top-[48%] left-[4%] w-[min(28rem,80vw)] h-[min(28rem,50vh)] rounded-full blur-3xl ${c.c}`}
      />
      <div
        className={`absolute bottom-[18%] right-[10%] w-[min(32rem,85vw)] h-[min(32rem,55vh)] rounded-full blur-3xl ${c.d}`}
      />
      <div
        className={`absolute bottom-0 left-1/3 w-[min(24rem,70vw)] h-[min(24rem,40vh)] rounded-full blur-3xl ${c.e}`}
      />
    </div>
  );
};

export default PublicBleedBackground;
