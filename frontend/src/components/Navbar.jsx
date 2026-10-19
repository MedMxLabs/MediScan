import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import Logo from './Logo';
import DesktopNav from './navbar/DesktopNav';
import MobileNav from './navbar/MobileNav';

/** Section ids on the landing page — order matters for scroll spy */
const SCROLL_SECTIONS = [
  { id: 'features', hash: '#features' },
  { id: 'how-it-works', hash: '#how-it-works' },
  { id: 'about', hash: '#about' },
  { id: 'contact', hash: '#contact' },
];

const SCROLL_SPY_OFFSET = 140;
const CLICK_SCROLL_LOCK_MS = 1000;

const Navbar = ({ embedded = false }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [spyHash, setSpyHash] = useState('');
  const clickLock = useRef(false);
  const clickLockTimer = useRef(null);
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

  useEffect(() => () => window.clearTimeout(clickLockTimer.current), []);

  const lockScrollSpy = () => {
    clickLock.current = true;
    window.clearTimeout(clickLockTimer.current);
    clickLockTimer.current = window.setTimeout(() => {
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

            <DesktopNav isActive={isActive} onNavClick={handleNavClick} />

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

      <MobileNav
        open={open}
        onClose={() => setOpen(false)}
        isActive={isActive}
        onNavClick={handleNavClick}
      />
    </>
  );
};

export default Navbar;
