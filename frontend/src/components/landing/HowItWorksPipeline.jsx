import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Search, BarChart3, HeartPulse } from 'lucide-react';

const STEPS = [
  {
    n: '01',
    title: 'Search or upload',
    text: 'Enter a medicine name or scan your prescription.',
    icon: Search,
  },
  {
    n: '02',
    title: 'Compare live prices',
    text: 'See side-by-side prices from all six pharmacies.',
    icon: BarChart3,
  },
  {
    n: '03',
    title: 'Save & track',
    text: 'Set reminders, track adherence, and revisit your history.',
    icon: HeartPulse,
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 32, scale: 0.94 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.55, delay: 0.15 + i * 0.2, ease: [0.22, 1, 0.36, 1] },
  }),
};

/** Animated connector between pipeline steps (desktop horizontal) */
const PipelineConnector = ({ delay = 0, index = 0 }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const gradId = `pipeGrad-${index}`;
  const glowId = `glow-${index}`;

  return (
    <motion.div
      ref={ref}
      className="hidden md:flex flex-1 items-center justify-center min-w-[48px] max-w-[120px] px-1 self-center"
      aria-hidden
    >
      <svg viewBox="0 0 120 24" className="w-full h-6 overflow-visible">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00a896" />
            <stop offset="100%" stopColor="#84cc16" />
          </linearGradient>
          <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <line x1="4" y1="12" x2="116" y2="12" stroke="rgba(255,255,255,0.15)" strokeWidth="2" strokeLinecap="round" />
        <motion.line
          x1="4"
          y1="12"
          x2="116"
          y2="12"
          stroke={`url(#${gradId})`}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="112"
          initial={{ strokeDashoffset: 112 }}
          animate={inView ? { strokeDashoffset: 0 } : { strokeDashoffset: 112 }}
          transition={{ duration: 0.9, delay, ease: 'easeInOut' }}
        />
        <motion.circle
          r="5"
          fill="#84cc16"
          filter={`url(#${glowId})`}
          cy="12"
          initial={{ cx: 4, opacity: 0 }}
          animate={
            inView
              ? { cx: [4, 116], opacity: [0, 1, 1, 0] }
              : { cx: 4, opacity: 0 }
          }
          transition={{
            duration: 1.4,
            delay: delay + 0.5,
            ease: 'easeInOut',
            repeat: Infinity,
            repeatDelay: 2.2,
          }}
        />
        <motion.polygon
          points="112,8 120,12 112,16"
          fill={`url(#${gradId})`}
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: delay + 0.7, duration: 0.35 }}
        />
      </svg>
    </motion.div>
  );
};

/** Vertical connector for mobile */
const VerticalConnector = ({ delay = 0 }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  return (
    <motion.div ref={ref} className="md:hidden flex justify-center py-2" aria-hidden>
      <svg width="24" height="48" viewBox="0 0 24 48" className="overflow-visible">
        <defs>
          <linearGradient id="pipeGradV" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#00a896" />
            <stop offset="100%" stopColor="#84cc16" />
          </linearGradient>
        </defs>
        <line x1="12" y1="4" x2="12" y2="44" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
        <motion.line
          x1="12"
          y1="4"
          x2="12"
          y2="44"
          stroke="url(#pipeGradV)"
          strokeWidth="2.5"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={inView ? { pathLength: 1 } : {}}
          transition={{ duration: 0.7, delay }}
        />
        <motion.circle
          r="4"
          fill="#84cc16"
          cx="12"
          initial={{ cy: 4, opacity: 0 }}
          animate={
            inView
              ? { cy: [4, 44], opacity: [0, 1, 1, 0] }
              : {}
          }
          transition={{
            duration: 1.2,
            delay: delay + 0.4,
            repeat: Infinity,
            repeatDelay: 2,
          }}
        />
      </svg>
    </motion.div>
  );
};

const PipelineStep = ({ step, index }) => {
  const Icon = step.icon;

  return (
    <motion.article
      custom={index}
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      whileHover={{ y: -8, transition: { duration: 0.25 } }}
      className="group relative flex-1 min-w-0"
    >
      <div className="relative p-6 sm:p-7 rounded-2xl bg-white/[0.07] border border-white/15 backdrop-blur-md shadow-lg shadow-black/10 overflow-hidden transition-shadow duration-300 group-hover:shadow-xl group-hover:border-teal/30 group-hover:bg-white/[0.1]">
        {/* Hover glow */}
        <motion.div
          className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-teal/20 blur-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        />

        <div className="relative flex items-start gap-4">
          <motion.div
            className="shrink-0 flex flex-col items-center gap-2"
            whileHover={{ scale: 1.05 }}
          >
            <motion.span
              className="text-4xl sm:text-5xl font-black text-gradient leading-none"
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 + index * 0.15, type: 'spring', stiffness: 200 }}
            >
              {step.n}
            </motion.span>
            <span className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center text-white shadow-brand">
              <Icon size={18} strokeWidth={2.5} />
            </span>
          </motion.div>

          <motion.div className="min-w-0 pt-1">
            <h3 className="text-lg sm:text-xl font-bold text-white">{step.title}</h3>
            <p className="mt-2 text-slate-300 text-sm leading-relaxed">{step.text}</p>
          </motion.div>
        </div>

        {/* Step node on pipeline (desktop) */}
        <motion.div
          className="hidden md:block absolute -bottom-3 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-brand-gradient ring-4 ring-navy/80"
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.35 + index * 0.2, type: 'spring' }}
        />
      </div>
    </motion.article>
  );
};

const HowItWorksPipeline = () => {
  const sectionRef = useRef(null);
  const inView = useInView(sectionRef, { once: true, margin: '-100px' });

  return (
    <section id="how-it-works" ref={sectionRef} className="py-20 lg:py-28 relative overflow-hidden">
      <motion.div
        className="absolute inset-0 bg-navy pointer-events-none"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.6 }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-teal/25 via-navy to-lime/15 pointer-events-none" />
      <div className="absolute inset-0 bg-brand-gradient opacity-[0.12] pointer-events-none" />

      {/* Ambient orbs */}
      <motion.div
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-20 left-10 w-64 h-64 rounded-full bg-teal/15 blur-3xl pointer-events-none"
      />
      <motion.div
        animate={{ x: [0, -25, 0], y: [0, 25, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-10 right-10 w-72 h-72 rounded-full bg-lime/10 blur-3xl pointer-events-none"
      />

      <div className="relative layout-wide">
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl sm:text-4xl font-extrabold text-white mb-3"
        >
          How it works
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-slate-300 text-sm sm:text-base max-w-lg mb-14"
        >
          Search → pick the lowest MRP → set a reminder so you do not miss the next dose.
        </motion.p>

        {/* Desktop: horizontal pipeline */}
        <div className="hidden md:flex items-stretch gap-0">
          {STEPS.map((step, i) => (
            <React.Fragment key={step.n}>
              <PipelineStep step={step} index={i} />
              {i < STEPS.length - 1 && <PipelineConnector delay={0.3 + i * 0.35} index={i} />}
            </React.Fragment>
          ))}
        </div>

        {/* Mobile: vertical pipeline */}
        <div className="md:hidden flex flex-col items-stretch max-w-md mx-auto">
          {STEPS.map((step, i) => (
            <React.Fragment key={step.n}>
              <PipelineStep step={step} index={i} />
              {i < STEPS.length - 1 && <VerticalConnector delay={0.25 + i * 0.3} />}
            </React.Fragment>
          ))}
        </div>

        {/* Progress track under cards (desktop) */}
        <motion.div
          className="hidden md:block mt-10 mx-auto max-w-3xl"
          initial={{ opacity: 0, scaleX: 0 }}
          whileInView={{ opacity: 1, scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <motion.div className="h-1 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              className="h-full bg-brand-gradient rounded-full"
              initial={{ width: '0%' }}
              whileInView={{ width: '100%' }}
              viewport={{ once: true }}
              transition={{ duration: 1.8, delay: 0.6, ease: 'easeInOut' }}
            />
          </motion.div>
          <div className="flex justify-between mt-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <span>Start</span>
            <span className="text-teal">Compare</span>
            <span className="text-lime">Track</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorksPipeline;
