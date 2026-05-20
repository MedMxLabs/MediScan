import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell, TrendingUp, UploadCloud, Dna } from 'lucide-react';

const chartPath =
  'M8 52 L32 38 L56 44 L80 28 L104 32 L128 18 L152 22 L176 8';

const HeroDashboard = () => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, ease: 'easeOut' }}
    className="relative w-full min-w-0"
  >
    {/* Glow stays inside bounds — no negative inset */}
    <div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[85%] bg-brand-gradient-soft rounded-full blur-3xl opacity-70 pointer-events-none"
      aria-hidden
    />

    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300 }}
      className="relative z-10 w-full rounded-3xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-200/50 overflow-hidden xl:min-h-[420px]"
    >
      {/* Header: health overview + integrated badges (no floating outside) */}
      <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-muted font-medium">Health overview</p>
          <p className="text-lg font-bold text-navy">Hi, Rahul 👋</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Link
            to="/dashboard/upload"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 hover:border-teal/40 hover:bg-teal/5 transition-colors"
          >
            <span className="w-8 h-8 rounded-lg bg-teal/10 flex items-center justify-center text-teal shrink-0">
              <UploadCloud size={16} />
            </span>
            <span className="text-left">
              <span className="block text-[11px] font-bold text-navy leading-tight">Upload Rx</span>
              <span className="block text-[10px] text-muted">OCR ready</span>
            </span>
          </Link>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-teal bg-teal/10 px-3 py-2 rounded-full">
            <Dna size={14} className="text-teal-dark" />
            Live
          </span>
        </div>
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
        }}
        className="p-5 sm:p-6 lg:p-7 grid grid-cols-2 gap-3 lg:gap-4"
      >
        <motion.div
          variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
          className="col-span-2 rounded-2xl bg-slate-50 border border-slate-100 p-4"
        >
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-[11px] font-bold text-muted uppercase tracking-wide">Price comparison</p>
              <p className="text-sm font-bold text-navy">Dolo 650 · 6 pharmacies</p>
            </div>
            <TrendingUp size={18} className="text-teal shrink-0" />
          </div>
          <svg viewBox="0 0 184 60" className="w-full h-14" aria-hidden>
            <motion.path
              d={chartPath}
              fill="none"
              stroke="url(#chartGrad)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.8, delay: 0.4, ease: 'easeInOut' }}
            />
            <defs>
              <linearGradient id="chartGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00a896" />
                <stop offset="100%" stopColor="#84cc16" />
              </linearGradient>
            </defs>
          </svg>
          <p className="text-xs text-teal-dark font-bold mt-1">Save up to ₹18 vs highest price</p>
        </motion.div>

        <motion.div
          variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
          className="rounded-2xl bg-white border border-slate-100 p-3 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-2">
            <Bell size={14} className="text-orange-500 shrink-0" />
            <p className="text-[11px] font-bold text-navy">Reminder</p>
          </div>
          <p className="text-xs text-muted">Metformin · 8:00 PM</p>
        </motion.div>

        <motion.div
          variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
          className="rounded-2xl bg-white border border-slate-100 p-3 shadow-sm flex flex-col items-center"
        >
          <p className="text-[11px] font-bold text-navy self-start mb-1">Adherence</p>
          <div className="relative w-14 h-14">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36" aria-hidden>
              <circle cx="18" cy="18" r="15" fill="none" stroke="#e2e8f0" strokeWidth="3" />
              <motion.circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="url(#ringGrad)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="94"
                initial={{ strokeDashoffset: 94 }}
                animate={{ strokeDashoffset: 19 }}
                transition={{ duration: 1.2, delay: 0.6 }}
              />
              <defs>
                <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#00a896" />
                  <stop offset="100%" stopColor="#84cc16" />
                </linearGradient>
              </defs>
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-navy">82%</span>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  </motion.div>
);

export default HeroDashboard;
