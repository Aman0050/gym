/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // ==== Colors ====
      colors: {
        // Primary gradient via CSS custom property
        primaryStart: 'var(--brand-gradient-start)',
        primaryEnd:   'var(--brand-gradient-end)',
        surfaceDark:  '#0a0a0a',
        surfacePaper: '#121212',
        monoWhite:   '#ffffff',
        monoBlack:   '#000000',
        monoSilver:  '#c0c0c0',
        success: '#30e450',
        warning: '#ffb400',
        error:   '#ff4d4f',
      },

      // ==== Gradient ====
      backgroundImage: theme => ({
        'brand-diagonal': 'linear-gradient(135deg, #12c2e9 0%, #2af598 100%)',
      }),

      // ==== Typography ====
      fontFamily: {
        heading: ['"Clash Display"', 'system-ui', 'sans-serif'],
        body:    ['Satoshi', 'system-ui', 'sans-serif'],
      },

      // ==== Spacing ====
      spacing: {
        0: '0',
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        5: '24px',
        6: '32px',
        8: '48px',
        10: '64px',
      },

      // ==== Border Radius ====
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',   // used for app‑icon radius & card corners
        xl: '16px',
      },

      // ==== Box Shadows ====
      boxShadow: {
        glass: '0 4px 12px rgba(0,0,0,0.2)',
        subtle: '0 2px 6px rgba(0,0,0,0.15)',
      },

      // ==== Motion / Transition ====
      transitionDuration: {
        fast: '150ms',
        base: '300ms',
        slow: '600ms',
      },
      transitionTimingFunction: {
        ease: 'cubic-bezier(0.4,0,0.2,1)',   // smooth, material‑like
      },

      // ==== Glassmorphism Layer ====
      backdropBlur: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
      },

      // ==== Opacity ====
      opacity: {
        glass: '0.06',
        glassDark: '0.12',
      },
    },
  },
  plugins: [],
}
