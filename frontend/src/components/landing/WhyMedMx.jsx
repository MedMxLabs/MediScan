import React from 'react';
import { motion } from 'framer-motion';
import { Receipt, Package, ShieldCheck, LayoutGrid } from 'lucide-react';
import ScrollReveal from './ScrollReveal';
import { fadeUpChild, staggerContainer } from './landingMotion';

const POINTS = [
  {
    icon: Receipt,
    title: 'You see the bill before you pay',
    body: 'Walk into a chemist knowing which site had the lower MRP yesterday — not discovering it after checkout.',
  },
  {
    icon: Package,
    title: 'Made for Indian packs & brands',
    body: 'Dolo 650, not “acetaminophen 500 mg generic.” INR, strip sizes, and the pharmacies people here actually use.',
  },
  {
    icon: ShieldCheck,
    title: 'Your data stays yours',
    body: 'Prescriptions and lab PDFs are encrypted at rest. We explain results; we do not replace your doctor.',
  },
  {
    icon: LayoutGrid,
    title: 'One login instead of five tabs',
    body: 'Compare, upload Rx, reminders, labs, and chat live in one place — the way families already manage health.',
  },
];

const WhyMedMx = () => (
  <section id="about" className="relative py-12 sm:py-16 lg:py-20 scroll-mt-nav">
    <div className="layout-wide">
      <ScrollReveal>
        <div className="glass-panel rounded-2xl sm:rounded-3xl p-5 sm:p-8 lg:p-10">
          <header className="max-w-2xl">
            <h2 className="text-xl sm:text-2xl lg:text-[1.75rem] font-bold text-navy leading-snug">
              Why people stick with MedMx
            </h2>
            <p className="mt-2 text-[15px] sm:text-base text-muted leading-relaxed">
              Not another symptom checker. A practical layer on top of how medicines are bought in India.
            </p>
          </header>

          <motion.div
            className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1, margin: '0px 0px -40px 0px' }}
          >
            {POINTS.map((p) => {
              const Icon = p.icon;
              return (
                <motion.article
                  key={p.title}
                  variants={fadeUpChild}
                  className="glass-card hover-lift rounded-xl sm:rounded-2xl p-4 sm:p-5 hover:bg-white/55"
                >
                  <div className="flex items-start gap-3">
                    <span className="glass-chip flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-teal">
                      <Icon size={20} strokeWidth={2} />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-[15px] sm:text-base font-bold text-navy leading-snug">{p.title}</h3>
                      <p className="mt-2 text-[14px] sm:text-[15px] text-muted leading-relaxed">{p.body}</p>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </motion.div>
        </div>
      </ScrollReveal>
    </div>
  </section>
);

export default WhyMedMx;
