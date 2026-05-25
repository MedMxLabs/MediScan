
import { motion } from 'framer-motion';

const STATS = [
  { value: '6', unit: 'pharmacies', detail: 'Tata 1mg, PharmEasy, Apollo & more — live MRP' },
  { value: '₹', unit: 'real pricing', detail: 'Storefront rupees, not guesswork' },
  { value: '<60s', unit: 'to compare', detail: 'Typical multi-site search' },
  { value: '100%', unit: 'encrypted', detail: 'Rx, reminders & lab uploads' },
  { value: '24/7', unit: 'access', detail: 'Search and dose alerts anytime' },
  { value: '10K+', unit: 'households', detail: 'Already comparing on MedMx' },
];

const StatsBar = () => (
  <section className="relative pt-6 lg:pt-8 pb-12 lg:pb-16" aria-label="Key metrics">
    <div className="layout-wide">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-2xl bg-navy shadow-xl shadow-navy/25"
      >
        <div
          className="absolute inset-0 bg-gradient-to-br from-teal/30 via-navy to-lime/20 pointer-events-none"
          aria-hidden
        />
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-gradient" aria-hidden />

        <div className="relative px-5 sm:px-8 py-5 sm:py-6 border-b border-white/10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-teal">Why it matters</p>
            <p className="mt-1 text-lg sm:text-xl font-bold text-white leading-snug">
              Built for how India actually buys medicines
            </p>
          </div>
          <p className="text-sm text-slate-400 max-w-md sm:text-right leading-relaxed">
            No catalog markups — we read what pharmacies show right now.
          </p>
        </div>

        <ul className="relative grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 divide-y sm:divide-y-0 sm:divide-x divide-white/10">
          {STATS.map((s, i) => (
            <motion.li
              key={s.unit}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.06 + i * 0.04, duration: 0.35 }}
              className="px-5 sm:px-6 py-5 lg:py-6 transition-colors duration-300 hover:bg-white/5"
            >
              <p className="text-[2rem] sm:text-[2.25rem] font-extrabold text-white leading-none tracking-tight tabular-nums">
                {s.value}
              </p>
              <p className="mt-1.5 text-sm font-semibold text-lime">{s.unit}</p>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">{s.detail}</p>
            </motion.li>
          ))}
        </ul>
      </motion.div>
    </div>
  </section>
);

export default StatsBar;
