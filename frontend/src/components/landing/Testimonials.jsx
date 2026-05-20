import React from 'react';
import { Quote } from 'lucide-react';

const TESTIMONIALS = [
  {
    quote:
      'Saved ₹120 on my monthly diabetes meds by switching from the pharmacy I always used to Netmeds. I did not believe the numbers until I opened both sites.',
    name: 'Priya S.',
    detail: 'Bangalore · compares refills every month',
  },
  {
    quote:
      'Uploaded my dad’s prescription — names were right. Reminders mean I am not the only one remembering 8 PM Metformin.',
    name: 'Rahul M.',
    detail: 'Mumbai',
  },
  {
    quote:
      'Lab summary finally explained what “elevated HbA1c” meant without a 40-tab Google spiral.',
    name: 'Anita K.',
    detail: 'Delhi',
  },
  {
    quote:
      'Compared Crocin prices before a trip — PharmEasy was ₹14 higher than Netmeds for the same strip.',
    name: 'Suresh K.',
    detail: 'Chennai',
  },
  {
    quote:
      'My mother’s monthly BP meds list is in one place now. No more WhatsApp photos lost in the family group.',
    name: 'Meera V.',
    detail: 'Hyderabad',
  },
];

/** Rotating teal / lime / blended card skins */
const CARD_VARIANTS = [
  {
    shell:
      'border-teal/40 bg-gradient-to-br from-teal/35 via-[#0f2847] to-navy shadow-[0_8px_32px_-8px_rgba(0,168,150,0.45)]',
    bar: 'bg-gradient-to-r from-teal via-teal/60 to-transparent',
    icon: 'text-teal',
    name: 'text-teal',
  },
  {
    shell:
      'border-lime/35 bg-gradient-to-br from-lime/30 via-[#122a45] to-navy shadow-[0_8px_32px_-8px_rgba(132,204,22,0.35)]',
    bar: 'bg-gradient-to-r from-lime via-lime/50 to-transparent',
    icon: 'text-lime',
    name: 'text-lime',
  },
  {
    shell:
      'border-white/25 bg-gradient-to-br from-teal/20 via-lime/15 to-[#0a192f] shadow-[0_8px_32px_-8px_rgba(255,255,255,0.12)]',
    bar: 'bg-brand-gradient',
    icon: 'text-white/80',
    name: 'text-white',
  },
];

const TestimonialCard = ({ item, variantIndex, duplicate }) => {
  const v = CARD_VARIANTS[variantIndex % CARD_VARIANTS.length];

  return (
    <figure
      className={`hover-lift shrink-0 w-[min(100vw-2rem,18rem)] sm:w-[22rem] lg:w-[24rem] rounded-2xl border backdrop-blur-sm p-4 sm:p-5 lg:p-6 overflow-hidden ${v.shell}`}
      aria-hidden={duplicate}
    >
      <div className={`h-1 w-full rounded-full mb-4 ${v.bar}`} aria-hidden />
      <Quote className={`mb-3 w-8 h-8 ${v.icon}`} strokeWidth={1.5} aria-hidden />
      <p className="text-[15px] sm:text-base text-white leading-relaxed font-medium">
        &ldquo;{item.quote}&rdquo;
      </p>
      <figcaption className="mt-4 pt-3 border-t border-white/15 text-sm">
        <span className={`font-bold ${v.name}`}>{item.name}</span>
        <span className="text-slate-300/90"> — {item.detail}</span>
      </figcaption>
    </figure>
  );
};

const MarqueeTrack = () => {
  const items = [...TESTIMONIALS, ...TESTIMONIALS];

  return (
    <div
      className="flex w-max items-stretch gap-4 sm:gap-5 px-4 sm:px-6 animate-marquee-ltr motion-reduce:animate-none hover:[animation-play-state:paused]"
      role="list"
      aria-label="User testimonials"
    >
      {items.map((item, i) => (
        <TestimonialCard
          key={`${item.name}-${i}`}
          item={item}
          variantIndex={i}
          duplicate={i >= TESTIMONIALS.length}
        />
      ))}
    </div>
  );
};

const Testimonials = () => (
  <section className="w-full overflow-x-hidden" aria-labelledby="testimonials-heading">
    <div className="relative w-full bg-navy overflow-hidden">
      <div
        className="absolute inset-0 bg-gradient-to-br from-teal/30 via-navy to-lime/25 pointer-events-none"
        aria-hidden
      />
      <div
        className="absolute -left-20 top-1/4 w-72 h-72 rounded-full bg-teal/25 blur-3xl pointer-events-none"
        aria-hidden
      />
      <div
        className="absolute -right-16 bottom-0 w-80 h-80 rounded-full bg-lime/20 blur-3xl pointer-events-none"
        aria-hidden
      />

      <div className="relative layout-wide pt-8 sm:pt-10 pb-5 flex justify-center">
        <p id="testimonials-heading" className="m-0">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-4 py-2 text-xs sm:text-sm font-bold uppercase tracking-[0.18em]">
            <span className="h-1.5 w-1.5 rounded-full bg-teal shrink-0" aria-hidden />
            <span className="text-gradient">From users</span>
            <span className="h-1.5 w-1.5 rounded-full bg-lime shrink-0" aria-hidden />
          </span>
        </p>
      </div>

      <div className="relative w-full overflow-hidden pb-9 sm:pb-11">
        <div
          className="pointer-events-none absolute left-0 top-0 bottom-0 z-10 w-14 sm:w-24 bg-gradient-to-r from-navy via-navy/80 to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute right-0 top-0 bottom-0 z-10 w-14 sm:w-24 bg-gradient-to-l from-navy via-navy/80 to-transparent"
          aria-hidden
        />
        <MarqueeTrack />
      </div>
    </div>
  </section>
);

export default Testimonials;
