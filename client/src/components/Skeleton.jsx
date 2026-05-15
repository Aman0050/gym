import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

/**
 * ─────────────────────────────────────────
 * Skeleton atom — shimmer loading placeholder
 * ─────────────────────────────────────────
 */
export const Skeleton = ({ className = '', circle = false }) => (
  <div
    className={`relative overflow-hidden bg-white/[0.04] ${
      circle ? 'rounded-full' : 'rounded-xl'
    } ${className}`}
  >
    <motion.div
      initial={{ x: '-100%' }}
      animate={{ x: '100%' }}
      transition={{ repeat: Infinity, duration: 1.8, ease: 'linear' }}
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent"
    />
  </div>
);

/**
 * ─────────────────────────────────────────
 * KPI Card Skeleton — matches Dashboard stat cards
 * ─────────────────────────────────────────
 */
export const CardSkeleton = () => (
  <div className="aura-glass p-8 h-full flex flex-col justify-between space-y-8">
    <Skeleton className="w-12 h-12 rounded-2xl" />
    <div className="space-y-2.5">
      <Skeleton className="h-2.5 w-16" />
      <Skeleton className="h-9 w-28" />
    </div>
  </div>
);

/**
 * ─────────────────────────────────────────
 * Table Row Skeleton — matches CRM table rows
 * ─────────────────────────────────────────
 */
export const TableRowSkeleton = () => (
  <div className="flex flex-col lg:flex-row lg:items-center px-6 lg:px-8 py-5 border-b border-white/[0.04] space-y-4 lg:space-y-0 lg:gap-6">
    <div className="flex-[2] flex items-center gap-4">
      <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-3.5 w-36" />
        <Skeleton className="h-2.5 w-24" />
      </div>
    </div>
    <Skeleton className="h-6 w-20 rounded-full flex-1" />
    <Skeleton className="hidden md:block flex-1 h-3 max-w-[100px]" />
    <Skeleton className="flex-1 h-3 w-20" />
    <div className="w-20 flex justify-end gap-2">
      <Skeleton className="w-9 h-9 rounded-xl" />
      <Skeleton className="w-9 h-9 rounded-xl" />
    </div>
  </div>
);

/**
 * ─────────────────────────────────────────
 * Dashboard Skeleton — full page loading state
 * ─────────────────────────────────────────
 */
export const DashboardSkeleton = () => (
  <div className="space-y-8 lg:space-y-10 max-w-screen-2xl mx-auto pb-safe-area animate-in fade-in duration-500">
    {/* Header */}
    <div className="aura-glass p-8 lg:p-12 flex flex-col lg:flex-row justify-between items-center gap-8">
      <div className="space-y-3 w-full lg:w-auto">
        <Skeleton className="h-2.5 w-28 mx-auto lg:mx-0" />
        <Skeleton className="h-10 w-56 mx-auto lg:mx-0" />
        <Skeleton className="h-3 w-72 mx-auto lg:mx-0" />
      </div>
      <div className="flex gap-3 w-full lg:w-auto">
        <Skeleton className="h-11 flex-1 lg:w-28 rounded-2xl" />
        <Skeleton className="h-11 flex-1 lg:w-28 rounded-2xl" />
        <Skeleton className="h-11 flex-1 lg:w-36 rounded-2xl" />
      </div>
    </div>

    {/* KPI Stats */}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>

    {/* Chart + Sidebar */}
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-8 aura-glass p-8 lg:p-10 h-80">
        <div className="flex justify-between mb-8">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-6 w-20 rounded-xl" />
        </div>
        <Skeleton className="h-52 w-full rounded-2xl" />
      </div>
      <div className="lg:col-span-4 aura-glass h-80 overflow-hidden p-0">
        <div className="p-6 border-b border-white/[0.06]">
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="p-5 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between items-center bg-white/[0.03] p-4 rounded-2xl">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-3.5 w-2/3" />
                <Skeleton className="h-2.5 w-1/2" />
              </div>
              <Skeleton className="w-9 h-9 rounded-xl ml-3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

/**
 * ─────────────────────────────────────────
 * Profile Skeleton — MemberProfile loading state
 * ─────────────────────────────────────────
 */
export const ProfileSkeleton = () => (
  <div className="space-y-8 lg:space-y-10 max-w-screen-2xl mx-auto pb-safe-area animate-in fade-in duration-500">
    {/* Back nav */}
    <div className="aura-glass p-6 lg:p-8 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <Skeleton className="h-3 w-28" />
      </div>
      <Skeleton className="h-6 w-32 rounded-full" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Identity card */}
      <div className="lg:col-span-4 space-y-6">
        <div className="aura-glass p-8 lg:p-12">
          <div className="flex flex-col items-center gap-6">
            <Skeleton className="w-28 h-28 rounded-[2.5rem]" />
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-6 w-28 rounded-full" />
          </div>
          <div className="mt-8 pt-8 border-t border-white/[0.06] space-y-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-2.5 w-20" />
                <Skeleton className="h-2.5 w-28" />
              </div>
            ))}
          </div>
          <Skeleton className="h-11 w-full mt-8 rounded-2xl" />
        </div>
        <div className="aura-glass p-8">
          <Skeleton className="h-4 w-40 mb-6" />
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/[0.03] p-5 rounded-3xl space-y-3">
              <Skeleton className="h-2.5 w-16" />
              <Skeleton className="h-8 w-12" />
            </div>
            <div className="bg-white/[0.03] p-5 rounded-3xl space-y-3">
              <Skeleton className="h-2.5 w-16" />
              <Skeleton className="h-8 w-12" />
            </div>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="lg:col-span-8 space-y-8">
        <div className="aura-glass p-8 lg:p-12 h-56">
          <div className="flex justify-between mb-8">
            <Skeleton className="h-6 w-44" />
            <Skeleton className="w-10 h-10 rounded-xl" />
          </div>
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
        <div className="aura-glass overflow-hidden p-0">
          <div className="p-6 border-b border-white/[0.06]">
            <Skeleton className="h-4 w-36" />
          </div>
          <div className="p-4 space-y-3">
            <TableRowSkeleton />
            <TableRowSkeleton />
          </div>
        </div>
      </div>
    </div>
  </div>
);

/**
 * ─────────────────────────────────────────
 * PageLoader — Global route-level loading screen
 * ─────────────────────────────────────────
 */
export const PageLoader = () => (
  <div className="fixed inset-0 bg-obsidian z-[999] flex flex-col items-center justify-center gap-8">
    {/* Brand mark */}
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 bg-earth-clay rounded-2xl flex items-center justify-center shadow-2xl shadow-earth-clay/30 relative overflow-hidden">
        <div className="absolute inset-0 satin-shimmer opacity-20" />
        <Zap className="text-white relative z-10" size={22} fill="currentColor" />
      </div>
      <div>
        <p className="text-2xl font-serif font-black text-ivory tracking-tighter leading-none">FITVIBE</p>
        <p className="text-[8px] font-black uppercase tracking-[0.3em] text-earth-clay mt-0.5 opacity-70">
          Premium Management
        </p>
      </div>
    </div>

    {/* Spinner */}
    <div className="relative w-10 h-10">
      <div className="absolute inset-0 border-2 border-white/[0.06] rounded-full" />
      <div className="absolute inset-0 border-2 border-earth-clay rounded-full border-t-transparent animate-spin" />
    </div>

    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.6 }}
      className="label-text !text-slate-600 !tracking-widest"
    >
      Initializing...
    </motion.p>
  </div>
);
