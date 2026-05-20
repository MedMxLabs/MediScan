import React from 'react';

/** Shared teal → white → lime bleed used across the entire landing page */
const LandingBleedBackground = () => (
  <div className="landing-bleed fixed inset-0 -z-10 pointer-events-none overflow-hidden" aria-hidden>
    <div className="absolute inset-0 landing-bleed-gradient" />
    <div className="absolute inset-0 dna-pattern opacity-55" />
    <div className="absolute inset-0 dot-grid opacity-30" />
    <div className="absolute -top-24 -left-40 w-[min(36rem,90vw)] h-[min(36rem,70vh)] rounded-full bg-teal/14 blur-3xl" />
    <div className="absolute top-[22%] -right-32 w-[min(40rem,95vw)] h-[min(40rem,65vh)] rounded-full bg-lime/12 blur-3xl" />
    <div className="absolute top-[48%] left-[4%] w-[min(28rem,80vw)] h-[min(28rem,50vh)] rounded-full bg-teal/10 blur-3xl" />
    <div className="absolute bottom-[18%] right-[10%] w-[min(32rem,85vw)] h-[min(32rem,55vh)] rounded-full bg-lime/10 blur-3xl" />
    <div className="absolute bottom-0 left-1/3 w-[min(24rem,70vw)] h-[min(24rem,40vh)] rounded-full bg-teal/8 blur-3xl" />
  </div>
);

export default LandingBleedBackground;
