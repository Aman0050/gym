import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, X, ChevronDown } from 'lucide-react';

/**
 * ─────────────────────────────────────────
 * Aura Design System — Standard Animation Variants
 * ─────────────────────────────────────────
 */
export const transitions = {
  fast:      { type: 'spring', stiffness: 450, damping: 32 },
  normal:    { type: 'spring', stiffness: 320, damping: 28 },
  slow:      { type: 'spring', stiffness: 200, damping: 22 },
  cinematic: { duration: 1.0, ease: [0.22, 1, 0.36, 1] },
};

/**
 * ─────────────────────────────────────────
 * Premium Aura Card
 * variant="default" — lifts on hover (use for KPI / clickable cards)
 * variant="flat"    — no hover lift (use for containers / data-dense panels)
 * variant="glow"    — lifts + earth-clay glow
 * ─────────────────────────────────────────
 */
export const Card = memo(({ children, className = '', variant = 'default', glow = false }) => {
  const hoverProps =
    variant === 'flat'
      ? {}
      : variant === 'glow'
      ? { y: -6, boxShadow: '0 24px 60px -12px rgba(160, 82, 45, 0.25)' }
      : { y: -4, boxShadow: '0 20px 50px -12px rgba(0, 0, 0, 0.4)' };

  return (
    <motion.div
      whileHover={Object.keys(hoverProps).length > 0 ? hoverProps : undefined}
      transition={transitions.fast}
      className={`aura-glass p-8 ${glow ? 'box-glow' : ''} ${className}`}
    >
      {children}
    </motion.div>
  );
});
Card.displayName = 'Card';

/**
 * ─────────────────────────────────────────
 * High-End Wellness Input
 * ─────────────────────────────────────────
 */
export const Input = memo(({ label, icon: Icon, error, className = '', ...props }) => (
  <div className="space-y-2.5 w-full">
    {label && (
      <label className="label-text ml-1 block">
        {label}
      </label>
    )}
    <div className="relative group">
      {Icon && (
        <Icon
          className={`absolute left-5 top-1/2 -translate-y-1/2 transition-all duration-300 pointer-events-none
            ${error ? 'text-red-400' : 'text-slate-500 group-focus-within:text-earth-clay group-focus-within:scale-105'}`}
          size={17}
        />
      )}
      <input
        {...props}
        className={`input-field ${Icon ? 'pl-14' : ''} ${
          error
            ? 'border-red-500/30 focus:ring-red-500/10 focus:border-red-500/40'
            : ''
        } ${className}`}
      />
    </div>
    <AnimatePresence>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className="text-[10px] text-red-400 font-semibold ml-1 flex items-center gap-1.5"
        >
          <AlertCircle size={11} />
          {error}
        </motion.p>
      )}
    </AnimatePresence>
  </div>
));
Input.displayName = 'Input';

/**
 * ─────────────────────────────────────────
 * Styled Select — matches Input visual style
 * ─────────────────────────────────────────
 */
export const Select = memo(({ label, error, children, className = '', ...props }) => (
  <div className="space-y-2.5 w-full">
    {label && (
      <label className="label-text ml-1 block">
        {label}
      </label>
    )}
    <select
      {...props}
      className={`select-field ${
        error ? 'border-red-500/30 focus:ring-red-500/10' : ''
      } ${className}`}
    >
      {children}
    </select>
    <AnimatePresence>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className="text-[10px] text-red-400 font-semibold ml-1"
        >
          {error}
        </motion.p>
      )}
    </AnimatePresence>
  </div>
));
Select.displayName = 'Select';

/**
 * ─────────────────────────────────────────
 * Premium Cinematic Modal
 * Uses explicit `accentWords` array for controlled accent styling
 * ─────────────────────────────────────────
 */
export const Modal = memo(({ isOpen, onClose, title, subtitle, children, maxWidth = 'max-w-xl' }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-obsidian/70 backdrop-blur-2xl"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 30 }}
          transition={transitions.normal}
          className={`aura-glass-heavy w-full ${maxWidth} relative overflow-hidden shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] max-h-[90vh] flex flex-col`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="px-8 py-7 border-b border-white/[0.07] flex items-center justify-between bg-white/[0.03] flex-shrink-0">
            <div>
              <h3 className="text-lg font-black text-ivory tracking-tight leading-tight">{title}</h3>
              {subtitle && <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest mt-1">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="touch-target p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-ivory transition-all border border-white/[0.07] ml-4 flex-shrink-0"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
          {/* Modal Body */}
          <div className="p-8 overflow-y-auto premium-scrollbar flex-1">
            {children}
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
));
Modal.displayName = 'Modal';

/**
 * ─────────────────────────────────────────
 * Enterprise Status Badge System
 * ─────────────────────────────────────────
 */
export const StatusBadge = memo(({ status }) => {
  const styles = {
    ACTIVE:    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    FROZEN:    'bg-sky-500/10 text-sky-400 border-sky-500/20',
    INACTIVE:  'bg-red-500/10 text-red-400 border-red-500/20',
    PENDING:   'bg-amber-500/10 text-amber-400 border-amber-500/20',
    EXPIRED:   'bg-orange-500/10 text-orange-400 border-orange-500/20',
    OVERDUE:   'bg-red-500/10 text-red-400 border-red-500/20',
    QUEUED:    'bg-slate-500/10 text-slate-400 border-slate-500/20',
    SUSPENDED: 'bg-red-500/10 text-red-400 border-red-500/20',
    SYSTEM:    'bg-white/5 text-slate-500 border-white/10',
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.25em] border backdrop-blur-sm ${
        styles[status] || styles.SYSTEM
      }`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-70" />
      {status}
    </span>
  );
});
StatusBadge.displayName = 'StatusBadge';

/**
 * ─────────────────────────────────────────
 * Aura Silk Table
 * ─────────────────────────────────────────
 */
export const Table = memo(({ headers, children, isLoading, emptyMessage = 'No records found', emptyIcon }) => {
  return (
    <div className="w-full overflow-hidden flex flex-col relative">
      {/* Desktop Headers */}
      <div className="hidden lg:flex bg-obsidian/80 backdrop-blur-xl items-center px-8 py-5 border-b border-white/[0.07] sticky top-0 z-10">
        {headers.map((h, i) => (
          <div key={i} className={`label-text !text-slate-500 !text-[8px] ${h.className || 'flex-1'}`}>
            {h.label}
          </div>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto premium-scrollbar relative">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-white/[0.03] animate-pulse rounded-2xl border border-white/[0.04]" />
            ))}
          </div>
        ) : children ? (
          <div className="divide-y divide-white/[0.04]">{children}</div>
        ) : (
          <div className="py-24 flex flex-col items-center justify-center text-center opacity-40 px-6">
            {emptyIcon && (
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-5 border border-white/5">
                {emptyIcon}
              </div>
            )}
            <p className="text-sm font-semibold text-slate-500">{emptyMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
});
Table.displayName = 'Table';

/**
 * ─────────────────────────────────────────
 * Table Row
 * ─────────────────────────────────────────
 */
export const TableRow = memo(({ children, className = '', onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`
        flex flex-col lg:flex-row lg:items-center px-6 lg:px-8 py-5 lg:py-4
        hover:bg-white/[0.025] transition-colors duration-150 group
        relative
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      <div className="absolute inset-y-0 left-0 w-0.5 bg-earth-clay opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden lg:block" />
      {children}
    </div>
  );
});
TableRow.displayName = 'TableRow';

/**
 * ─────────────────────────────────────────
 * Premium Magnetic Button
 * Standardized height: min-h-[44px] (touch-safe)
 * ─────────────────────────────────────────
 */
export const Button = memo(({
  children,
  onClick,
  variant = 'primary',
  className = '',
  disabled = false,
  icon: Icon,
  loading = false,
  type = 'button',
}) => {
  const variants = {
    primary:   'bg-earth-clay text-white shadow-lg shadow-earth-clay/20 hover:bg-sienna border-transparent',
    secondary: 'bg-white/[0.06] hover:bg-white/[0.1] text-ivory border-white/[0.08] shadow-sm',
    danger:    'bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border-red-500/20',
    outline:   'bg-transparent border-white/10 hover:border-earth-clay/50 text-slate-400 hover:text-earth-clay',
    ghost:     'bg-transparent border-transparent text-slate-500 hover:text-ivory hover:bg-white/5',
  };

  return (
    <motion.button
      whileHover={!disabled && !loading ? { scale: 1.03 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.97 } : {}}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        min-h-[44px] px-8 rounded-2xl label-text !text-[10px]
        transition-colors duration-200
        flex items-center justify-center gap-2.5
        border
        disabled:opacity-30 disabled:cursor-not-allowed
        relative overflow-hidden group
        ${variants[variant]}
        ${className}
      `}
    >
      {variant === 'primary' && (
        <div className="absolute inset-0 satin-shimmer pointer-events-none opacity-10 group-hover:opacity-20 transition-opacity" />
      )}
      {loading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <div className="flex items-center gap-2.5 relative z-10">
          {Icon && <Icon size={15} className="transition-transform group-hover:scale-110 flex-shrink-0" />}
          <span>{children}</span>
        </div>
      )}
    </motion.button>
  );
});
Button.displayName = 'Button';

/**
 * ─────────────────────────────────────────
 * Premium Inline Alert
 * ─────────────────────────────────────────
 */
export const Alert = memo(({ type = 'info', message, title }) => {
  const config = {
    success: {
      icon: <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />,
      className: 'bg-emerald-500/5 border-emerald-500/10',
    },
    error: {
      icon: <AlertCircle size={16} className="text-red-400 flex-shrink-0" />,
      className: 'bg-red-500/5 border-red-500/10',
    },
    warning: {
      icon: <AlertCircle size={16} className="text-amber-400 flex-shrink-0" />,
      className: 'bg-amber-500/5 border-amber-500/10',
    },
    info: {
      icon: <Info size={16} className="text-earth-clay flex-shrink-0" />,
      className: 'bg-earth-clay/5 border-earth-clay/10',
    },
  };

  const { icon, className } = config[type] || config.info;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`p-5 rounded-2xl border backdrop-blur-sm flex items-start gap-4 ${className}`}
    >
      <div className="mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        {title && (
          <p className="text-xs font-black text-ivory mb-1 uppercase tracking-wider">{title}</p>
        )}
        <p className="text-xs text-slate-400 font-medium leading-relaxed">{message}</p>
      </div>
    </motion.div>
  );
});
Alert.displayName = 'Alert';

/**
 * ─────────────────────────────────────────
 * Confirmation Dialog (replaces window.confirm)
 * ─────────────────────────────────────────
 */
export const ConfirmDialog = memo(({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Confirm', confirmVariant = 'danger' }) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-sm">
    <div className="space-y-6">
      <p className="text-sm text-slate-400 leading-relaxed">{message}</p>
      <div className="flex gap-3">
        <Button variant="secondary" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button variant={confirmVariant} onClick={onConfirm} className="flex-1">
          {confirmLabel}
        </Button>
      </div>
    </div>
  </Modal>
));
ConfirmDialog.displayName = 'ConfirmDialog';
