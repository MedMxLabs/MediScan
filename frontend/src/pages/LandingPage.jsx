import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  UploadCloud,
  Sparkles,
  Star,
  ArrowRight,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Logo from '../components/Logo';
import Button from '../components/ui/Button';
import HeroDashboard from '../components/landing/HeroDashboard';
import FeaturesSection from '../components/landing/FeaturesSection';
import HowItWorksPipeline from '../components/landing/HowItWorksPipeline';
import StatsBar from '../components/landing/StatsBar';
import PriceShowcase from '../components/landing/PriceShowcase';
import PharmacySources from '../components/landing/PharmacySources';
import WhyMedMx from '../components/landing/WhyMedMx';
import Testimonials from '../components/landing/Testimonials';
import FAQ from '../components/landing/FAQ';
import LandingBleedBackground from '../components/landing/LandingBleedBackground';
import ScrollReveal from '../components/landing/ScrollReveal';

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
};

const AVATARS = ['AS', 'PK', 'RM', 'JD'];

const LandingPage = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      window.scrollTo(0, 0);
    }
  }, [location.pathname, location.hash]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative min-h-screen flex flex-col overflow-x-hidden w-full"
    >
      <LandingBleedBackground />

      <div className="relative z-10 flex flex-col">
      {/* Hero + navbar */}
      <div className="relative flex flex-col overflow-x-hidden min-h-screen w-full">
        <Navbar embedded />

        <section className="relative flex-1 pt-6 sm:pt-10 lg:pt-14 pb-20 lg:pb-28 w-full">
          {/* Side accents sit in the gutter outside the main column */}
          <div className="hidden xl:block pointer-events-none absolute inset-y-0 left-0 right-0 z-0" aria-hidden>
            <div className="layout-wide relative h-full mx-auto">
              <motion.div
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="absolute left-0 top-[32%] -translate-x-[calc(100%+1.25rem)] px-4 py-3 rounded-2xl bg-white/90 border border-teal/20 shadow-lg backdrop-blur-sm animate-float"
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-teal">Live compare</p>
                <p className="text-sm font-extrabold text-navy mt-0.5">6 pharmacies</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.65, duration: 0.6 }}
                className="absolute left-0 top-[58%] -translate-x-[calc(100%+2rem)] px-4 py-3 rounded-2xl bg-white/90 border border-lime/25 shadow-lg backdrop-blur-sm animate-float-delayed"
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-lime-dark">Avg. savings</p>
                <p className="text-sm font-extrabold text-navy mt-0.5">Up to ₹18</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.55, duration: 0.6 }}
                className="absolute right-0 top-[38%] translate-x-[calc(100%+1.25rem)] px-4 py-3 rounded-2xl bg-white/90 border border-teal/20 shadow-lg backdrop-blur-sm animate-float-slow"
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-teal-dark">Prescription OCR</p>
                <p className="text-sm font-extrabold text-navy mt-0.5">Under 2 min</p>
              </motion.div>
            </div>
          </div>

          <motion.div
            className="relative layout-wide z-10"
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 xl:gap-14 2xl:gap-16 items-center">
              <div className="min-w-0">
                <motion.div
                  variants={fadeUp}
                  className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white/90 border border-teal/25 text-xs font-bold uppercase tracking-wider text-teal-dark mb-8 shadow-sm"
                >
                  <Sparkles size={14} className="text-lime" />
                  AI-powered healthcare intelligence
                </motion.div>

                <motion.h1
                  variants={fadeUp}
                  className="text-4xl sm:text-5xl lg:text-[3.5rem] xl:text-[4rem] font-extrabold text-navy leading-[1.06] tracking-tight"
                >
                  Smarter decisions.
                  <br />
                  <span className="text-gradient">Better health.</span>
                </motion.h1>

                <motion.p
                  variants={fadeUp}
                  className="mt-7 text-lg sm:text-xl lg:text-[1.35rem] text-muted max-w-2xl leading-relaxed"
                >
                  Compare live medicine prices, upload prescriptions, track doses, and get AI-powered
                  insights — built for Indian pharmacies and INR pricing.
                </motion.p>

                <motion.div variants={fadeUp} className="mt-10 flex flex-col sm:flex-row gap-4">
                  <Link to="/dashboard/search">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button variant="primary" size="lg" className="w-full sm:w-auto gap-2 shadow-brand">
                        <Search size={18} />
                        Compare Medicines
                      </Button>
                    </motion.div>
                  </Link>
                  <Link to="/dashboard/upload">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        variant="outline"
                        size="lg"
                        className="w-full sm:w-auto gap-2 border-teal/30 hover:border-teal"
                      >
                        <UploadCloud size={18} className="text-teal" />
                        Upload Prescription
                      </Button>
                    </motion.div>
                  </Link>
                </motion.div>

                <motion.div variants={fadeUp} className="mt-12 flex flex-wrap items-center gap-5 pt-2">
                  <div className="flex -space-x-2">
                    {AVATARS.map((initials, i) => (
                      <motion.span
                        key={initials}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 + i * 0.08 }}
                        className="w-10 h-10 rounded-full border-2 border-white bg-brand-gradient text-white text-[10px] font-bold flex items-center justify-center shadow-sm"
                      >
                        {initials}
                      </motion.span>
                    ))}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-navy">Trusted by thousands of users</p>
                    <p className="flex items-center gap-1.5 text-sm text-muted mt-0.5">
                      <span className="flex text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={14} fill="currentColor" />
                        ))}
                      </span>
                      <span className="font-semibold text-navy">4.8/5</span> rating
                    </p>
                  </div>
                </motion.div>
              </div>

              <motion.div variants={fadeUp} className="min-w-0 w-full lg:pl-2 xl:pl-6">
                <HeroDashboard />
              </motion.div>
            </div>
          </motion.div>
        </section>
      </div>

      <StatsBar />
      <FeaturesSection />
      <PharmacySources />
      <PriceShowcase />

    <HowItWorksPipeline />

    <WhyMedMx />

    <Testimonials />

    <FAQ />

    <ScrollReveal
      as="section"
      className="py-12 sm:py-16 lg:py-20 bg-navy text-white scroll-mt-nav"
    >
      <div className="layout-wide flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 sm:gap-8">
        <div className="max-w-xl">
          <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight">
            Start with one medicine search. See if it saves you money.
          </h2>
          <p className="mt-4 text-slate-300 leading-relaxed">
            Free account · no card to compare · takes about a minute for most common brands.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 shrink-0">
          <Link to="/signup">
            <Button variant="primary" size="lg" className="gap-2 w-full sm:w-auto shadow-brand">
              Create account <ArrowRight size={18} />
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="outlineOnDark" size="lg" className="w-full sm:w-auto">
              Sign in
            </Button>
          </Link>
        </div>
      </div>
    </ScrollReveal>

    <footer id="contact" className="bg-navy text-white mt-auto scroll-mt-nav">
      <div className="layout-wide py-16 lg:py-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          <div className="lg:col-span-1">
            <Logo size="md" showLink={false} theme="on-dark" />
            <p className="mt-5 text-sm text-slate-300 leading-relaxed">
              MedMx LABS helps you compare live medicine prices, manage prescriptions, and make smarter
              health decisions across India.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-teal mb-5">Platform</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>
                <Link to="/dashboard/search" className="hover:text-lime transition-colors duration-300">
                  Price search
                </Link>
              </li>
              <li>
                <Link to="/dashboard/upload" className="hover:text-lime transition-colors duration-300">
                  Prescription OCR
                </Link>
              </li>
              <li>
                <Link to="/dashboard/reports" className="hover:text-lime transition-colors duration-300">
                  Lab reports
                </Link>
              </li>
              <li>
                <Link to="/dashboard/assistant" className="hover:text-lime transition-colors duration-300">
                  AI assistant
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-teal mb-5">Company</h4>
            <ul className="space-y-3 text-sm text-slate-300">
              <li>
                <a href="/#about" className="hover:text-lime transition-colors duration-300">
                  About
                </a>
              </li>
              <li>
                <a href="/#how-it-works" className="hover:text-lime transition-colors duration-300">
                  How it works
                </a>
              </li>
              <li>
                <a href="/#features" className="hover:text-lime transition-colors duration-300">
                  Features
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-teal mb-5">Legal</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>
                <a href="#" className="hover:text-lime transition-colors duration-300">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-lime transition-colors duration-300">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="mailto:support@medmx.in" className="hover:text-lime transition-colors duration-300">
                  support@medmx.in
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between gap-4 text-xs text-slate-400">
          <span>© {new Date().getFullYear()} MedMx LABS. Informational only — not medical advice.</span>
          <span className="text-gradient font-semibold">Smarter choices. Better health.</span>
        </div>
      </div>
    </footer>
      </div>
    </motion.div>
  );
};

export default LandingPage;
