import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  UploadCloud,
  Sparkles,
  Star,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import AndroidAppDownloadButton from '../components/AndroidAppDownloadButton';
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
import LandingFooter from '../components/landing/LandingFooter';
import BleedBackground from '../components/BleedBackground';
import BackedByMicrosoft from '../components/BackedByMicrosoft';
import { fadeUp, staggerContainer as stagger } from '../components/landing/landingMotion';

const AVATARS = ['AS', 'PK', 'RM', 'JD'];

const LandingPage = () => {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) {
      window.scrollTo(0, 0);
      return undefined;
    }
    const id = location.hash.replace('#', '');
    const timer = setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    return () => clearTimeout(timer);
  }, [location.pathname, location.hash]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative min-h-screen flex flex-col overflow-x-hidden w-full"
    >
      <BleedBackground variant="landing" />

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
                <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-3 mb-8">
                  <BackedByMicrosoft pill />
                  <div className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white/90 border border-teal/25 text-xs font-bold uppercase tracking-wider text-teal-dark shadow-sm">
                    <Sparkles size={14} className="text-lime" />
                    AI-powered healthcare intelligence
                  </div>
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

                <motion.div variants={fadeUp} className="mt-10 flex flex-col sm:flex-row flex-wrap gap-4">
                  <Link to="/search">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button variant="primary" size="lg" className="w-full sm:w-auto gap-2 shadow-brand">
                        <Search size={18} />
                        Compare Medicines
                      </Button>
                    </motion.div>
                  </Link>
                  <Link to="/upload">
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
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <AndroidAppDownloadButton
                      variant="secondary"
                      size="lg"
                      className="w-full sm:w-auto shadow-sm"
                    >
                      Get Android App
                    </AndroidAppDownloadButton>
                  </motion.div>
                </motion.div>

                <motion.p variants={fadeUp} className="mt-3 text-sm text-muted max-w-xl">
                  Free Android APK for any phone. After download, open the file and tap Install (enable
                  &quot;Install unknown apps&quot; for your browser if Android asks).
                </motion.p>

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

    <LandingFooter />
      </div>
    </motion.div>
  );
};

export default LandingPage;
