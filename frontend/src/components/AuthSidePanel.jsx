
import { ShieldCheck, Cpu, Award, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import BackedByMicrosoft from './BackedByMicrosoft';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
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
  <div className="hidden lg:flex w-[48%] relative overflow-hidden flex-col justify-center px-12 xl:px-16 2xl:px-20 bg-navy">
    <div className="absolute inset-0 bg-brand-gradient opacity-[0.22] pointer-events-none" />
    <div className="absolute inset-0 dot-grid opacity-[0.12] pointer-events-none" />
    <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-teal/25 blur-3xl" />
    <div className="absolute -bottom-32 -left-20 w-[28rem] h-[28rem] rounded-full bg-lime/12 blur-3xl" />

    <motion.div
      initial="hidden"
      animate="visible"
      variants={stagger}
      className="relative z-10 max-w-lg mx-auto w-full space-y-10"
    >
      <motion.div variants={fadeUp}>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/15 bg-white/5 text-teal text-[11px] font-bold uppercase tracking-widest mb-5">
          <Sparkles size={14} className="text-lime" />
          MedMx LABS
        </div>
        <h2 className="text-3xl xl:text-4xl font-extrabold text-white leading-[1.15] tracking-tight">
          Your health{' '}
          <span className="text-gradient">intelligence</span> platform
        </h2>
        <p className="text-sm text-slate-300/90 mt-4 leading-relaxed max-w-md">
          Compare medicines, track adherence, and get AI guidance — built for Indian healthcare.
        </p>
      </motion.div>

      <div className="space-y-4">
        {ITEMS.map(({ icon: Icon, title, text }) => (
          <motion.div
            key={title}
            variants={fadeUp}
            className="glass-card-dark rounded-2xl p-5 flex gap-4 transition-transform duration-300 hover:translate-x-0.5"
          >
            <div className="shrink-0 w-11 h-11 rounded-xl bg-brand-gradient flex items-center justify-center text-white shadow-brand">
              <Icon size={20} strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-white text-[15px]">{title}</h3>
              <p className="text-sm text-slate-300/90 mt-1 leading-relaxed">{text}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div variants={fadeUp} className="pt-2">
        <BackedByMicrosoft variant="dark" />
      </motion.div>
    </motion.div>
  </div>
);

export default AuthSidePanel;
