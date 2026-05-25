
import { motion, useReducedMotion } from 'framer-motion';
import { fadeUp, staggerContainer, viewportDefault } from './landingMotion';

/**
 * Scroll-triggered reveal. Respects prefers-reduced-motion.
 */
const ScrollReveal = ({
  children,
  className = '',
  stagger = false,
  variant,
  as = 'div',
}) => {
  const reduced = useReducedMotion();
  const variants = variant || (stagger ? staggerContainer : fadeUp);

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  const Component = motion[as] ?? motion.div;

  return (
    <Component
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={viewportDefault}
    >
      {children}
    </Component>
  );
};

export default ScrollReveal;
