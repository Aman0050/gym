import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

/**
 * Aura Design System — Standard Easing Curve
 * Cinematic ease-out for primary transitions
 */
export const auraEasing = [0.22, 1, 0.36, 1];

/**
 * ─────────────────────────────────────────
 * FadeIn — Standard page/section entry animation
 * Reduced default duration for snappier feel on list items
 * ─────────────────────────────────────────
 */
export const FadeIn = ({
  children,
  delay = 0,
  direction = 'up',
  distance = 20,
  duration = 0.5,
  className = '',
}) => {
  const directions = {
    up:    { y: distance },
    down:  { y: -distance },
    left:  { x: distance },
    right: { x: -distance },
  };

  return (
    <motion.div
      initial={{ opacity: 0, ...directions[direction] }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration, delay, ease: auraEasing }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * ─────────────────────────────────────────
 * AnimatedCounter — Premium number roll-up
 * Supports prefix (e.g. "₹"), suffix, and decimal places
 * ─────────────────────────────────────────
 */
export const AnimatedCounter = ({
  value,
  duration = 1.8,
  prefix = '',
  suffix = '',
  decimals = 0,
}) => {
  const [count, setCount] = useState(0);
  const frameRef = useRef(null);

  useEffect(() => {
    const end = parseFloat(value) || 0;

    if (end === 0) {
      setCount(0);
      return;
    }

    if (frameRef.current) cancelAnimationFrame(frameRef.current);

    const startTime = performance.now();
    const totalMs = duration * 1000;

    const update = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / totalMs, 1);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(parseFloat((eased * end).toFixed(decimals)));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(update);
      }
    };

    frameRef.current = requestAnimationFrame(update);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [value, duration, decimals]);

  return (
    <span>
      {prefix}{decimals > 0 ? count.toFixed(decimals) : count.toLocaleString('en-IN')}{suffix}
    </span>
  );
};

/**
 * ─────────────────────────────────────────
 * HoverCard — Subtle lift for interactive cards
 * Reduced y from -12 → -5 for professional restraint
 * ─────────────────────────────────────────
 */
export const HoverCard = ({ children, className = '' }) => (
  <motion.div
    whileHover={{ y: -5, boxShadow: '0 24px 60px -12px rgba(0,0,0,0.45)' }}
    whileTap={{ scale: 0.99 }}
    transition={{ type: 'spring', stiffness: 400, damping: 28 }}
    className={className}
  >
    {children}
  </motion.div>
);

/**
 * ─────────────────────────────────────────
 * PageTransition — Wraps each page for smooth route change
 * ─────────────────────────────────────────
 */
export const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.4, ease: auraEasing }}
  >
    {children}
  </motion.div>
);

/**
 * ─────────────────────────────────────────
 * StaggeredList — Animate list items in sequence
 * Accepts className to override default spacing
 * ─────────────────────────────────────────
 */
export const StaggeredList = ({
  children,
  delay = 0,
  staggerDelay = 0.07,
  className = 'space-y-4',
}) => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: delay,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 16 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease: auraEasing } },
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className={className}>
      {Array.isArray(children)
        ? children.map((child, i) => (
            <motion.div key={i} variants={item}>
              {child}
            </motion.div>
          ))
        : children}
    </motion.div>
  );
};

/**
 * ─────────────────────────────────────────
 * SlideIn — Panel / drawer entry animation
 * ─────────────────────────────────────────
 */
export const SlideIn = ({ children, from = 'bottom', className = '' }) => {
  const origins = {
    bottom: { y: '100%' },
    top:    { y: '-100%' },
    left:   { x: '-100%' },
    right:  { x: '100%' },
  };

  return (
    <motion.div
      initial={{ opacity: 0, ...origins[from] }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, ...origins[from] }}
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * ─────────────────────────────────────────
 * SuccessCheck — Cinematic animated checkmark
 * ─────────────────────────────────────────
 */
export const SuccessCheck = ({ size = 'md' }) => {
  const sizes = {
    sm: { container: 'w-12 h-12 rounded-2xl', icon: 24 },
    md: { container: 'w-16 h-16 rounded-3xl', icon: 32 },
    lg: { container: 'w-20 h-20 rounded-[2rem]', icon: 40 },
  };
  const s = sizes[size] || sizes.md;

  return (
    <motion.div
      initial={{ scale: 0, rotate: -30 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
      className={`${s.container} bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/10`}
    >
      <motion.svg
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
        width={s.icon}
        height={s.icon}
        viewBox="0 0 24 24"
        fill="none"
        stroke="#10b981"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <motion.polyline points="20 6 9 17 4 12" />
      </motion.svg>
    </motion.div>
  );
};
