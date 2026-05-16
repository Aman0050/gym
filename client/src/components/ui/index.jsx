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
 * Smart Empty State
 * ─────────────────────────────────────────
 */
export const EmptyState = memo(({ 
  icon: Icon = Activity, 
  title = "No Data Available", 
  description = "Get started by taking the first step in this workflow.",
  action = null 
}) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center text-center p-12 lg:p-20 space-y-6 max-w-lg mx-auto"
  >
    <div className="w-20 h-20 rounded-[2rem] bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-earth-clay shadow-2xl relative group">
      <div className="absolute inset-0 bg-earth-clay/5 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
      <Icon size={32} className="relative z-10" />
    </div>
    <div className="space-y-2">
      <h3 className="text-xl font-black text-ivory tracking-tight">{title}</h3>
      <p className="text-sm text-slate-500 font-medium leading-relaxed">
        {description}
      </p>
    </div>
    {action && (
      <div className="pt-2">
        {action}
      </div>
    )}
  </motion.div>
));
EmptyState.displayName = 'EmptyState';

/**
 * ─────────────────────────────────────────
 * Premium Aura Card
 * variant="default" — lifts on hover (use for KPI / clickable cards)
 * variant="flat"    — no hover lift (use for containers / data-dense panels)
 * variant="glow"    — lifts + earth-clay glow
 * ─────────────────────────────────────────
 */
export const Card = memo(({ children, className = '', variant = 'default', glow = false, onClick }) => {
  const hoverProps =
    variant === 'flat'
      ? {}
      : variant === 'glow'
      ? { y: -6, boxShadow: '0 24px 60px -12px rgba(160, 82, 45, 0.25)' }
      : { y: -4, boxShadow: '0 20px 50px -12px rgba(0, 0, 0, 0.4)' };

  return (
    <motion.div
      whileHover={Object.keys(hoverProps).length > 0 ? hoverProps : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      transition={transitions.fast}
      className={`aura-glass p-8 ${glow ? 'box-glow' : ''} ${onClick ? 'cursor-pointer' : ''} ${className}`}
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
export const Modal = memo(({ 
  isOpen, 
  onClose, 
  title, 
  subtitle, 
  children, 
  maxWidth = 'max-w-xl',
  variant = 'default' 
}) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-obsidian/80 backdrop-blur-2xl"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          transition={transitions.normal}
          className={`aura-glass-heavy w-full ${maxWidth} relative overflow-hidden shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] max-h-[90vh] flex flex-col`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Progress Indicator (Subtle top bar) */}
          <div className={`absolute top-0 left-0 h-0.5 w-full bg-gradient-to-r ${variant === 'destructive' ? 'from-red-500/50 to-red-400/20' : 'from-earth-clay/50 to-earth-clay/20'}`} />

          {/* Modal Header */}
          <div className="px-8 py-7 border-b border-white/[0.07] flex items-center justify-between bg-white/[0.02] flex-shrink-0">
            <div className="space-y-1">
              <h3 className={`text-lg font-black tracking-tight leading-tight ${variant === 'destructive' ? 'text-red-400' : 'text-ivory'}`}>
                {title}
              </h3>
              {subtitle && (
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">
                  {subtitle}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="touch-target p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-500 hover:text-ivory transition-all border border-white/[0.07] ml-4 flex-shrink-0 group"
              aria-label="Close"
            >
              <X size={16} className="group-hover:rotate-90 transition-transform duration-300" />
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
 * Operational Priority Badge
 * ─────────────────────────────────────────
 */
export const PriorityBadge = memo(({ level = 'STABLE', className = '' }) => {
  const configs = {
    CRITICAL: { label: 'Critical',  bg: 'bg-red-500/15',  text: 'text-red-400',    border: 'border-red-500/30',  glow: 'shadow-[0_0_12px_rgba(239,68,68,0.2)]' },
    URGENT:   { label: 'Urgent',    bg: 'bg-amber-500/15', text: 'text-amber-400',  border: 'border-amber-500/30', glow: '' },
    WARNING:  { label: 'Warning',   bg: 'bg-earth-clay/15',text: 'text-earth-clay', border: 'border-earth-clay/30', glow: '' },
    STABLE:   { label: 'Stable',    bg: 'bg-emerald-500/15',text: 'text-emerald-400',border: 'border-emerald-500/30', glow: '' },
  };

  const config = configs[level] || configs.STABLE;

  return (
    <div className={`
      inline-flex items-center px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-[0.15em]
      ${config.bg} ${config.text} ${config.border} ${config.glow} ${className}
    `}>
      <span className={`w-1 h-1 rounded-full mr-2 ${config.text.replace('text-', 'bg-')} animate-pulse`} />
      {config.label}
    </div>
  );
});
PriorityBadge.displayName = 'PriorityBadge';

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
export const Table = memo(({ 
  headers, 
  children, 
  emptyMessage = "No data found", 
  emptyDescription = null,
  emptyIcon = null, 
  emptyAction = null,
  maxHeight = "65vh" 
}) => (
  <div className="aura-glass overflow-hidden flex flex-col">
    <div className="overflow-x-auto overflow-y-auto premium-scrollbar" style={{ maxHeight }}>
      <table className="w-full text-left border-collapse min-w-[600px]">
        <thead className="sticky top-0 z-10 bg-obsidian/95 backdrop-blur-xl border-b border-white/[0.08] shadow-sm">
          <tr>
            {headers.map((h, idx) => (
              <th 
                key={idx} 
                className={`px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ${h.className || ''}`}
              >
                {h.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.04]">
          {children}
        </tbody>
      </table>
    </div>
    {!children || (Array.isArray(children) && children.length === 0) ? (
      <EmptyState
        icon={emptyIcon || Search}
        title={emptyMessage}
        description={emptyDescription || "No records match your current criteria. Try adjusting your filters or adding a new entry."}
        action={emptyAction}
      />
    ) : null}
  </div>
));
Table.displayName = 'Table';

/**
 * ─────────────────────────────────────────
 * Table Row
 * ─────────────────────────────────────────
 */
export const TableRow = memo(({ children, className = '', onClick, isSelected = false }) => {
  return (
    <motion.tr
      onClick={onClick}
      whileTap={onClick ? { scale: 0.998 } : undefined}
      className={`
        group transition-all duration-150 relative
        ${onClick ? 'cursor-pointer' : ''}
        ${isSelected ? 'bg-earth-clay/5 border-l-2 border-l-earth-clay' : 'hover:bg-white/[0.02]'}
        ${className}
      `}
    >
      {React.Children.map(children, (child) => (
        <td className="px-8 py-5 align-middle">
          {child}
        </td>
      ))}
    </motion.tr>
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
      whileHover={!disabled && !loading ? { scale: 1.02, y: -1 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.96 } : {}}
      transition={transitions.fast}
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

export const ConfirmDialog = memo(({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmLabel = 'Confirm', 
  confirmVariant = 'danger',
  loading = false 
}) => (
  <Modal 
    isOpen={isOpen} 
    onClose={onClose} 
    title={title} 
    maxWidth="max-w-sm" 
    variant={confirmVariant === 'danger' ? 'destructive' : 'default'}
  >
    <div className="space-y-8">
      <div className="flex items-start gap-4 p-5 bg-white/[0.03] border border-white/[0.06] rounded-2xl">
        <div className={`p-2 rounded-xl flex-shrink-0 ${confirmVariant === 'danger' ? 'bg-red-500/10 text-red-400' : 'bg-earth-clay/10 text-earth-clay'}`}>
          <AlertCircle size={20} />
        </div>
        <p className="text-sm text-slate-400 leading-relaxed font-medium">
          {message}
        </p>
      </div>

      <div className="flex gap-3">
        <Button 
          variant="secondary" 
          onClick={onClose} 
          className="flex-1"
          disabled={loading}
        >
          Cancel
        </Button>
        <Button 
          variant={confirmVariant === 'danger' ? 'danger' : 'primary'} 
          onClick={onConfirm} 
          className="flex-1 shadow-2xl"
          loading={loading}
        >
          {confirmLabel}
        </Button>
      </div>
    </div>
  </Modal>
));
ConfirmDialog.displayName = 'ConfirmDialog';
