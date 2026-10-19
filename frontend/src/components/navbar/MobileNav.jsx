import { Link } from 'react-router-dom';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { ArrowRight, X } from 'lucide-react';
import AndroidAppDownloadButton from '../AndroidAppDownloadButton';
import Button from '../ui/Button';
import { NAV, getNavTo, navSpring } from './navItems';

const MobileNav = ({ open, onClose, isActive, onNavClick }) => (
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
          onClick={onClose}
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
            <button type="button" onClick={onClose} className="p-2 text-navy" aria-label="Close menu">
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
                    onClick={onNavClick(item)}
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
            <AndroidAppDownloadButton variant="secondary" size="md" fullWidth>
              Download Android App
            </AndroidAppDownloadButton>
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
);

export default MobileNav;
