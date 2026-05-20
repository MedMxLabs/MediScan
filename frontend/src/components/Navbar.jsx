import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { Menu, X, ArrowRight, User } from 'lucide-react';
import Logo from './Logo';
import Button from './ui/Button';

const NAV = [
  { label: 'Home', to: '/', hash: '' },
  { label: 'Features', to: '/', hash: '#features' },
  { label: 'How it Works', to: '/', hash: '#how-it-works' },
  { label: 'About Us', to: '/', hash: '#about' },
  { label: 'Contact', to: '/', hash: '#contact' },
];

/** Section ids on the landing page — order matters for scroll spy */
const SCROLL_SECTIONS = [
  { id: 'features', hash: '#features' },
  { id: 'how-it-works', hash: '#how-it-works' },
  { id: 'about', hash: '#about' },
  { id: 'contact', hash: '#contact' },
];

const SCROLL_SPY_OFFSET = 140;
const CLICK_SCROLL_LOCK_MS = 1000;

const navSpring = { type: 'spring', stiffness: 420, damping: 34 };
const fadeDown = {
  hidden: { opacity: 0, y: -14 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.12 + i * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  }),
};

const DesktopNavLink = ({ item, active, to, index, onClick }) => (
  <motion.div
    custom={index}
    variants={fadeDown}
    initial="hidden"
    animate="visible"
    className="relative"
  >
    <motion.div whileHover={{ scale: active ? 1 : 1.02 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.2 }}>
      <Link
        to={to}
        onClick={onClick}
        className="group relative block px-5 xl:px-6 py-2.5 text-sm font-semibold whitespace-nowrap rounded-full"
      >
        {active && (
          <motion.span
            layout
            layoutId="nav-active-pill"
            className="absolute inset-0 rounded-full bg-brand-gradient shadow-brand"
            transition={navSpring}
            aria-hidden
          />
        )}

        <span
          className={`relative z-10 transition-colors duration-300 ${
            active ? 'text-white' : 'text-navy group-hover:text-teal-dark'
          }`}
        >
          {item.label}
        </span>
      </Link>
    </motion.div>
  </motion.div>
);

const getNavTo = (item) =>
  item.hash ? `${item.to}${item.hash}` : { pathname: '/', hash: '' };

const Navbar = ({ embedded = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [spyHash, setSpyHash] = useState('');
  const clickLock = useRef(false);
  const scrollTicking = useRef(false);

  useEffect(() => {
    if (location.pathname === '/') {
      setSpyHash(location.hash || '');
    } else {
      setSpyHash('');
    }
  }, [location.pathname, location.hash]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (location.pathname !== '/') return undefined;

    const resolveActiveHash = () => {
      const line = window.scrollY + SCROLL_SPY_OFFSET;
      let active = '';
      for (const section of SCROLL_SECTIONS) {
        const el = document.getElementById(section.id);
        if (el && el.offsetTop <= line) active = section.hash;
      }
      return active;
    };

    const updateSpy = () => {
      if (clickLock.current) return;
      const next = resolveActiveHash();
      setSpyHash((prev) => (prev === next ? prev : next));
    };

    const onScroll = () => {
      if (scrollTicking.current) return;
      scrollTicking.current = true;
      requestAnimationFrame(() => {
        updateSpy();
        scrollTicking.current = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    updateSpy();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [location.pathname]);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const lockScrollSpy = () => {
    clickLock.current = true;
    window.setTimeout(() => {
      clickLock.current = false;
    }, CLICK_SCROLL_LOCK_MS);
  };

  const isActive = (item) => {
    if (location.pathname !== '/') return false;
    if (item.hash) return spyHash === item.hash;
    return spyHash === '';
  };

  const goHome = (e) => {
    e.preventDefault();
    lockScrollSpy();
    setSpyHash('');
    navigate({ pathname: '/', hash: '' }, { replace: false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavClick = (item) => (e) => {
    if (!item.hash) {
      goHome(e);
      return;
    }
    lockScrollSpy();
    setSpyHash(item.hash);
  };

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className={`z-50 w-full ${
          embedded
            ? `sticky top-0 ${
                scrolled
                  ? 'bg-white/95 backdrop-blur-xl border-b border-slate-200/80 shadow-sm'
                  : 'bg-transparent border-b border-transparent'
              }`
            : `sticky top-0 border-b ${
                scrolled
                  ? 'bg-white/95 backdrop-blur-xl border-slate-200 shadow-sm'
                  : 'bg-white border-slate-200/80'
              }`
        }`}
        style={{ transition: 'background-color 0.35s ease, box-shadow 0.35s ease' }}
      >
        {!embedded && <div className="h-1 w-full bg-brand-gradient" aria-hidden />}

        <div className="layout-wide">
          <div className="flex h-[4.5rem] lg:h-20 items-center justify-between gap-8 lg:gap-12">
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05, duration: 0.45 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                to={{ pathname: '/', hash: '' }}
                onClick={goHome}
                className="shrink-0"
                aria-label="MedMx LABS home"
              >
                <Logo showLink={false} size="md" theme="light" />
              </Link>
            </motion.div>

            <nav
              className="hidden lg:flex items-center justify-center flex-1 px-4 xl:px-8"
              aria-label="Main navigation"
            >
              <LayoutGroup id="desktop-nav">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15, type: 'spring', stiffness: 280, damping: 22 }}
                  whileHover={{ scale: 1.01 }}
                  className="nav-capsule inline-flex items-center gap-1 rounded-full p-1"
                >
                  {NAV.map((item, index) => {
                    const active = isActive(item);
                    return (
                      <DesktopNavLink
                        key={item.label}
                        item={item}
                        active={active}
                        to={getNavTo(item)}
                        onClick={handleNavClick(item)}
                        index={index}
                      />
                    );
                  })}
                </motion.div>
              </LayoutGroup>
            </nav>

            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.45 }}
              className="hidden lg:flex items-center gap-5 xl:gap-6 shrink-0 pl-2"
            >
              <motion.div whileHover={{ x: 2 }} transition={{ duration: 0.2 }}>
                <Link
                  to="/login"
                  className="flex items-center gap-2.5 text-sm font-semibold text-slate-600 hover:text-navy transition-colors whitespace-nowrap px-2"
                >
                  <motion.span whileHover={{ rotate: [0, -8, 8, 0] }} transition={{ duration: 0.4 }}>
                    <User size={18} className="text-teal" />
                  </motion.span>
                  Sign in
                </Link>
              </motion.div>
              <Link to="/signup">
                <motion.div
                  whileHover={{ scale: 1.04, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 24 }}
                >
                  <Button variant="primary" size="sm" className="gap-1.5 shadow-brand whitespace-nowrap">
                    Get Started
                    <motion.span
                      animate={{ x: [0, 3, 0] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <ArrowRight size={15} />
                    </motion.span>
                  </Button>
                </motion.div>
              </Link>
            </motion.div>

            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              className="lg:hidden p-2.5 rounded-xl text-navy hover:bg-slate-100 shrink-0"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-label={open ? 'Close menu' : 'Open menu'}
            >
              <AnimatePresence mode="wait" initial={false}>
                {open ? (
                  <motion.span
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X size={22} />
                  </motion.span>
                ) : (
                  <motion.span
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu size={22} />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-navy/40 backdrop-blur-sm"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            />
            <motion.nav
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="absolute top-0 right-0 h-full w-[min(100%,320px)] bg-white shadow-2xl p-6 flex flex-col"
              aria-label="Mobile navigation"
            >
              <div className="flex justify-end mb-6">
                <button type="button" onClick={() => setOpen(false)} className="p-2 text-navy">
                  <X size={22} />
                </button>
              </div>
              <LayoutGroup id="mobile-nav">
              <motion.div
                className="space-y-1 flex-1"
                initial="hidden"
                animate="visible"
                variants={{
                  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
                }}
              >
                {NAV.map((item) => {
                  const active = isActive(item);
                  return (
                    <motion.div
                      key={item.label}
                      variants={{
                        hidden: { opacity: 0, x: 24 },
                        visible: { opacity: 1, x: 0, transition: { duration: 0.35 } },
                      }}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Link
                        to={getNavTo(item)}
                        onClick={handleNavClick(item)}
                        className="relative block px-4 py-3 rounded-full text-sm font-semibold overflow-hidden"
                      >
                        {active && (
                          <motion.span
                            layout
                            layoutId="nav-active-pill-mobile"
                            className="absolute inset-0 rounded-full bg-brand-gradient shadow-brand"
                            transition={navSpring}
                            aria-hidden
                          />
                        )}
                        <span className={`relative z-10 ${active ? 'text-white' : 'text-navy'}`}>
                          {item.label}
                        </span>
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.div>
              </LayoutGroup>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.4 }}
                className="space-y-3 pt-4 border-t border-slate-100"
              >
                <Link to="/login">
                  <Button variant="outline" fullWidth>
                    Sign in
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button variant="primary" fullWidth className="gap-2">
                    Get Started <ArrowRight size={16} />
                  </Button>
                </Link>
              </motion.div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
