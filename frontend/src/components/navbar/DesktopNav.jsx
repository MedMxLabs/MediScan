import { Link } from 'react-router-dom';
import { motion, LayoutGroup } from 'framer-motion';
import { ArrowRight, User } from 'lucide-react';
import AndroidAppDownloadButton from '../AndroidAppDownloadButton';
import Button from '../ui/Button';
import { NAV, getNavTo, navSpring } from './navItems';

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

const DesktopNav = ({ isActive, onNavClick }) => (
  <>
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
          {NAV.map((item, index) => (
            <DesktopNavLink
              key={item.label}
              item={item}
              active={isActive(item)}
              to={getNavTo(item)}
              onClick={onNavClick(item)}
              index={index}
            />
          ))}
        </motion.div>
      </LayoutGroup>
    </nav>

    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2, duration: 0.45 }}
      className="hidden lg:flex items-center gap-4 xl:gap-5 shrink-0 pl-2"
    >
      <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
        <AndroidAppDownloadButton variant="outline" size="sm" className="whitespace-nowrap">
          Android App
        </AndroidAppDownloadButton>
      </motion.div>
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
  </>
);

export default DesktopNav;
