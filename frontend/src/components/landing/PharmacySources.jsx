import React from 'react';

const SOURCES = ['Tata 1mg', 'PharmEasy', 'Apollo Pharmacy', 'Netmeds', 'TrueMeds', 'MedPlus'];

const MarqueeTrack = () => {
  const items = [...SOURCES, ...SOURCES];

  return (
    <div className="flex w-max items-center animate-marquee-rtl motion-reduce:animate-none hover:[animation-play-state:paused]">
      {items.map((name, i) => (
        <span
          key={`${name}-${i}`}
          className="inline-flex shrink-0 items-center"
          aria-hidden={i >= SOURCES.length}
        >
          <span className="px-8 sm:px-12 lg:px-14 text-xl sm:text-2xl lg:text-3xl font-bold text-white/95 whitespace-nowrap">
            {name}
          </span>
          <span
            className="inline-flex w-10 sm:w-12 shrink-0 items-center justify-center text-xl sm:text-2xl text-teal/50 leading-none select-none"
            aria-hidden
          >
            ·
          </span>
        </span>
      ))}
    </div>
  );
};

const PharmacySources = () => (
  <div id="pharmacies" className="w-full overflow-x-hidden" aria-label="Pharmacy partners">
    {/* Label — separate band on normal page background (no navy) */}
    <div className="flex items-center justify-center py-5 sm:py-6 border-t border-slate-200/80">
      <p className="text-center text-xs sm:text-sm font-bold uppercase tracking-[0.22em] text-teal-dark m-0">
        Live MRP pulled from
      </p>
    </div>

    {/* Pharmacy names — dark marquee only */}
    <div className="relative w-full bg-navy overflow-hidden">
      <div
        className="absolute inset-0 bg-gradient-to-r from-teal/20 via-navy to-lime/15 pointer-events-none"
        aria-hidden
      />

      <div className="relative w-full overflow-hidden py-7 sm:py-8">
        <div
          className="pointer-events-none absolute left-0 top-0 bottom-0 z-10 w-10 sm:w-16 bg-gradient-to-r from-navy to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute right-0 top-0 bottom-0 z-10 w-10 sm:w-16 bg-gradient-to-l from-navy to-transparent"
          aria-hidden
        />
        <MarqueeTrack />
      </div>
    </div>
  </div>
);

export default PharmacySources;
