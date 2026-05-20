import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Mail } from 'lucide-react';
import ScrollReveal from './ScrollReveal';
import { easeSmooth } from './landingMotion';

const PHARMACIES = ['PharmEasy', 'Netmeds', 'Apollo Pharmacy', 'TrueMeds', 'MedPlus', 'Tata 1mg'];

const FAQS = [
  {
    q: 'Are the prices really live?',
    a: 'When you search, we query current product pages from the pharmacies below. Results reflect what those sites show at that moment.',
    showPharmacies: true,
  },
  {
    q: 'Is MedMx LABS a substitute for medical advice?',
    a: 'No. MedMx helps you compare prices and organize health information. Always consult a qualified doctor for diagnosis, dosage changes, or emergencies.',
  },
  {
    q: 'How does prescription upload work?',
    a: 'Upload a photo or PDF of your prescription. Our OCR extracts medicine names so you can search and compare prices in one flow.',
  },
  {
    q: 'Do I need an account to compare prices?',
    a: 'You can explore the platform after signing up for free. Search history, reminders, and lab reports are saved to your secure account.',
  },
  {
    q: 'Which medicines can I search?',
    a: 'Most branded and generic medicines sold on the supported pharmacies. Try brand names (e.g. Dolo 650) or salt names (e.g. Paracetamol) for best results.',
  },
];

const FAQ = () => {
  const [open, setOpen] = useState(0);

  return (
    <section id="faq" className="relative py-12 sm:py-16 lg:py-20 scroll-mt-nav">
      <div className="layout-wide">
        <ScrollReveal>
          <div className="glass-panel rounded-2xl sm:rounded-3xl p-5 sm:p-8 lg:p-10">
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,13rem)_1fr] gap-6 sm:gap-8 lg:gap-12">
              <aside className="lg:sticky lg:top-28 lg:self-start">
                <div className="glass-card hover-lift rounded-xl sm:rounded-2xl p-5">
                  <h2 className="text-xl sm:text-2xl font-bold text-navy">Questions</h2>
                  <p className="mt-3 text-sm text-muted leading-relaxed">
                    Quick answers before you sign up.
                  </p>
                  <a
                    href="mailto:support@medmx.in"
                    className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-teal-dark hover:text-teal transition-colors duration-300"
                  >
                    <Mail size={16} />
                    support@medmx.in
                  </a>
                </div>
              </aside>

              <div className="glass-card rounded-xl sm:rounded-2xl overflow-hidden divide-y divide-white/35">
                {FAQS.map((item, i) => {
                  const isOpen = open === i;
                  return (
                    <div
                      key={item.q}
                      className={`transition-colors duration-300 ${isOpen ? 'bg-white/25' : 'hover:bg-white/15'}`}
                    >
                      <button
                        type="button"
                        onClick={() => setOpen(isOpen ? -1 : i)}
                        className="w-full flex items-center justify-between gap-4 px-4 py-4 sm:px-6 sm:py-5 text-left group min-h-[3.25rem]"
                        aria-expanded={isOpen}
                      >
                        <span className="text-[15px] sm:text-base font-bold text-navy group-hover:text-teal-dark transition-colors duration-300 pr-2">
                          {item.q}
                        </span>
                        <ChevronDown
                          size={20}
                          className={`shrink-0 text-teal-dark transition-transform duration-300 ease-out ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                          aria-hidden
                        />
                      </button>
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.35, ease: easeSmooth }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-5 sm:px-6 sm:pb-6 -mt-1">
                              <p className="text-[14px] sm:text-[15px] text-muted leading-relaxed">{item.a}</p>
                              {item.showPharmacies && (
                                <div className="mt-4 glass-chip rounded-xl p-3 sm:p-4">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-teal-dark mb-2">
                                    Live MRP pulled from
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {PHARMACIES.map((name) => (
                                      <span
                                        key={name}
                                        className="inline-flex px-2.5 py-1.5 rounded-lg bg-white/35 border border-white/50 text-xs font-medium text-navy backdrop-blur-sm transition-colors hover:bg-white/50"
                                      >
                                        {name}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default FAQ;
