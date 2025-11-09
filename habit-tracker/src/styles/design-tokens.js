// Design System Tokens - Professional Design Standards

export const designTokens = {
  // Color Palette - Modern, Sophisticated & Vibrant
  colors: {
    primary: {
      50: '#eef2ff',
      100: '#e0e7ff', 
      200: '#c7d2fe',
      300: '#a5b4fc',
      400: '#818cf8',
      500: '#6366f1', // Primary brand color - indigo
      600: '#4f46e5',
      700: '#4338ca',
      800: '#3730a3',
      900: '#312e81',
      950: '#1e1b4b'
    },
    
    accent: {
      indigo: '#6366f1',
      blue: '#3b82f6',
      cyan: '#06b6d4',
      teal: '#14b8a6',
      emerald: '#10b981',
      amber: '#f59e0b',
      orange: '#f97316',
      rose: '#f43f5e'
    },
    
    neutral: {
      0: '#ffffff',
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      850: '#1a1a1a',
      900: '#141414',
      925: '#0d0d0d',
      950: '#080808'
    },
    
    semantic: {
      success: {
        light: '#34d399',
        DEFAULT: '#10b981',
        dark: '#059669'
      },
      warning: {
        light: '#fbbf24',
        DEFAULT: '#f59e0b',
        dark: '#d97706'
      },
      error: {
        light: '#f87171',
        DEFAULT: '#ef4444',
        dark: '#dc2626'
      },
      info: {
        light: '#60a5fa',
        DEFAULT: '#3b82f6',
        dark: '#2563eb'
      }
    }
  },
  
  // Typography Scale - Harmonious & Readable
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      display: ['Cal Sans', 'Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'Menlo', 'monospace']
    },
    
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      '5xl': ['3rem', { lineHeight: '1.2' }],
      '6xl': ['3.75rem', { lineHeight: '1.1' }]
    },
    
    fontWeight: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800'
    }
  },
  
  // Spacing Scale - Mathematical Harmony
  spacing: {
    px: '1px',
    0: '0',
    1: '0.25rem',    // 4px
    2: '0.5rem',     // 8px
    3: '0.75rem',    // 12px
    4: '1rem',       // 16px
    5: '1.25rem',    // 20px
    6: '1.5rem',     // 24px
    8: '2rem',       // 32px
    10: '2.5rem',    // 40px
    12: '3rem',      // 48px
    16: '4rem',      // 64px
    20: '5rem',      // 80px
    24: '6rem',      // 96px
    32: '8rem',      // 128px
  },
  
  // Border Radius - Consistent Curves
  borderRadius: {
    none: '0',
    sm: '0.375rem',   // 6px
    DEFAULT: '0.5rem', // 8px
    md: '0.75rem',    // 12px
    lg: '1rem',       // 16px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '2rem',    // 32px
    full: '9999px'
  },
  
  // Shadows - Depth & Elevation
  boxShadow: {
    xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    DEFAULT: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    md: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    lg: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    xl: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '2xl': '0 50px 100px -20px rgb(0 0 0 / 0.25)',
    glow: '0 0 20px rgb(168 85 247 / 0.15)',
    glowLg: '0 0 40px rgb(168 85 247 / 0.2)'
  },
  
  // Animation - Smooth & Natural
  animation: {
    duration: {
      fast: '150ms',
      normal: '250ms',
      slow: '350ms',
      slower: '500ms'
    },
    
    easing: {
      linear: 'linear',
      out: 'cubic-bezier(0.16, 1, 0.3, 1)',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
    }
  }
};

// Utility function to get design token values
export const getToken = (path) => {
  return path.split('.').reduce((obj, key) => obj?.[key], designTokens);
};


