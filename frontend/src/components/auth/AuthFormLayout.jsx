import { motion } from 'framer-motion';
import Logo from '../Logo';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.02 } },
};

/** Centered auth card — fits viewport without page scroll */
export default function AuthFormLayout({ title, subtitle, children, footer }) {
  return (
    <div className="relative w-full h-full max-h-[100dvh] flex flex-col justify-center items-center px-4 py-3 sm:py-4 overflow-hidden">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="auth-form-card relative z-10 w-full max-w-[400px] rounded-2xl p-5 sm:p-6 shrink-0"
      >
        <motion.div variants={fadeUp} className="mb-4">
          <Logo size="md" className="mb-3" />
          <h1 className="text-xl sm:text-2xl font-extrabold text-navy tracking-tight leading-tight">
            {title}
          </h1>
          {subtitle ? (
            <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-snug">{subtitle}</p>
          ) : null}
        </motion.div>

        <motion.div variants={fadeUp}>{children}</motion.div>

        {footer ? (
          <motion.div variants={fadeUp} className="mt-4 pt-3 border-t border-slate-200/70">
            {footer}
          </motion.div>
        ) : null}
      </motion.div>
    </div>
  );
}
