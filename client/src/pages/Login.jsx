import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { AtSign, Lock, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { Card, Input, Button } from '../components/ui';
import loginHero from '../assets/login_hero.jpg';
import logo from '../assets/logo-fitxeno.svg';
import lionIcon from '../assets/flaming-lion.png';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  // Magnetic parallax
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x, { stiffness: 120, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 120, damping: 20 });
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['8deg', '-8deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-8deg', '8deg']);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const handleMouseLeave = () => { x.set(0); y.set(0); };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const success = await login(identifier, password);
      if (success) {
        navigate('/dashboard', { replace: true });
      } else {
        setError('Invalid credentials. Please try again.');
      }
    } catch (err) {
      let errorMessage = 'Something went wrong. Please try again.';
      if (!err.response) {
        errorMessage = 'Network error or CORS block. Please check server status.';
      } else {
        errorMessage = err.response.data?.error || err.response.data?.message || errorMessage;
      }
      setError(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-obsidian flex relative overflow-hidden">

      {/* ── Left: Cinematic Hero ── */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-black">
        <motion.img
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
          src={loginHero}
          className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
          alt="FitXeno Wellness Hub"
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/10 z-10" />

        {/* Hero Content */}
        <div className="relative z-20 flex flex-col justify-end p-16 xl:p-24 w-full">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            <div className="flex items-center gap-5 mb-8">
              <div className="w-14 h-px bg-earth-clay shadow-[0_0_10px_rgba(160,82,45,0.8)]" />
              <span className="label-text !text-earth-clay">Secure Access</span>
            </div>
            <h2 className="text-6xl xl:text-7xl font-serif font-black text-white mb-8 leading-[0.9] drop-shadow-2xl">
              Wellness{' '}
              <span className="text-earth-clay italic">
                Intelligence.
              </span>
            </h2>
            <p className="text-base text-white/70 font-medium max-w-[24rem] leading-relaxed border-l-2 border-white/20 pl-6">
              Enterprise-grade gym management platform for modern wellness operators.
            </p>
          </motion.div>
        </div>
      </div>

      {/* ── Right: Auth Panel ── */}
      <div
        className="flex-1 flex items-center justify-center p-6 lg:p-12 relative"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Ambient glow */}
        <div className="wellness-aura opacity-20" />

        <motion.div
          style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
          initial={{ opacity: 0, scale: 0.95, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[460px] relative z-10"
        >
          {/* Top Bar: Return Link */}
          <div className="flex items-center justify-end mb-6">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2.5 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-earth-clay transition-colors group touch-target"
            >
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              Return
            </button>
          </div>

          {/* Brand Logo */}
          <div className="mb-10 flex flex-col items-start">
            <div
              className="flex items-center cursor-pointer group mb-4"
              onClick={() => navigate('/')}
            >
              <motion.img
                initial={{ scale: 1.30 }}
                whileHover={{ scale: 1.35, rotate: 5 }}
                src={lionIcon}
                alt="FitXeno Icon"
                className="w-24 h-24 sm:w-28 sm:h-28 object-contain relative z-10"
              />
              <img
                src={logo}
                alt="FitXeno"
                className="w-64 sm:w-72 object-contain -ml-2 sm:-ml-3 relative z-10"
                style={{ filter: 'brightness(0.95) contrast(1.05)' }}
              />
            </div>
            <p className="text-xs text-white font-bold tracking-[0.25em] pl-2 uppercase">Enterprise Management Portal</p>
          </div>

          {/* Auth Card */}
          <Card variant="flat" className="p-8 lg:p-10">
            {/* Error message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/10 border border-red-500/20 text-red-400 px-5 py-4 rounded-xl mb-6 text-xs font-semibold flex items-center gap-3"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                {error}
              </motion.div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <Input
                label="Gym ID or Email"
                type="text"
                placeholder="gymname or admin@fitxeno.io"
                icon={AtSign}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                autoComplete="username"
              />
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                icon={Lock}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                action={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-500 hover:text-earth-clay transition-colors touch-target w-8 h-8 flex items-center justify-center rounded-full focus:ring-1 focus:ring-earth-clay/50"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                }
              />

              <Button
                type="submit"
                loading={isLoading}
                className="w-full !py-5 shadow-[0_20px_40px_-10px_rgba(160,82,45,0.4)] mt-2"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </Card>

          {/* Security footer */}
          <div className="mt-8 flex items-center justify-between opacity-25 hover:opacity-60 transition-opacity duration-500">
            <div className="flex items-center gap-3">
              <span className="status-dot-success w-1.5 h-1.5" />
              <p className="text-[9px] font-black text-ivory uppercase tracking-[0.35em]">Secure Protocol</p>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-1.5 h-1.5 bg-earth-clay/20 rounded-full" />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
