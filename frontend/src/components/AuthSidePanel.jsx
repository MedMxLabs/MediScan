import React from 'react';
import { ShieldCheck, Cpu, Award } from 'lucide-react';
import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const ITEMS = [
  {
    icon: ShieldCheck,
    title: 'Secure & private',
    text: 'Your health data is encrypted. MedMx LABS is informational only — not a substitute for clinical care.',
  },
  {
    icon: Cpu,
    title: 'Live pharmacy prices',
    text: 'Comparisons come from real storefront pages at query time across six major pharmacies.',
  },
  {
    icon: Award,
    title: 'Built for India',
    text: 'Designed for Indian pharmacies, INR pricing, and local medicine naming conventions.',
  },
];

const AuthSidePanel = () => (
  <div className="hidden lg:flex w-[48%] bg-navy relative overflow-hidden flex-col justify-center px-14 xl:px-20">
    <div className="absolute inset-0 bg-brand-gradient opacity-20 pointer-events-none" />
    <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-teal/20 blur-3xl" />
    <div className="absolute -bottom-32 -left-16 w-96 h-96 rounded-full bg-lime/10 blur-3xl" />

    <motion.div initial="hidden" animate="visible" variants={stagger} className="relative z-10 space-y-10">
      <div>
        <p className="text-teal text-sm font-bold uppercase tracking-widest mb-3">MedMx LABS</p>
        <h2 className="text-3xl font-extrabold text-white leading-tight">
          Your health intelligence platform
        </h2>
      </div>

      {ITEMS.map(({ icon: Icon, title, text }) => (
        <motion.div key={title} variants={fadeUp} className="flex gap-4">
          <div className="shrink-0 w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-lime">
            <Icon size={22} strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="font-bold text-white">{title}</h3>
            <p className="text-sm text-slate-300 mt-1 leading-relaxed">{text}</p>
          </div>
        </motion.div>
      ))}
    </motion.div>
  </div>
);

export default AuthSidePanel;
