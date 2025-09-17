import tailwindcssAnimate from 'tailwindcss-animate'
import typography from '@tailwindcss/typography'

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  darkMode: ['selector', '[data-theme="dark"]'],
  plugins: [tailwindcssAnimate, typography],
  prefix: '',
  safelist: [
    'lg:col-span-4',
    'lg:col-span-6',
    'lg:col-span-8',
    'lg:col-span-12',
    'border-border',
    'bg-card',
    'border-error',
    'bg-error/30',
    'border-success',
    'bg-success/30',
    'border-warning',
    'bg-warning/30',
    // PetPal-inspired pastel backgrounds
    'bg-pastel-pink',
    'bg-pastel-mint',
    'bg-pastel-blue',
    'bg-pastel-lavender',
    'bg-pastel-yellow',
    'bg-gradient-hero',
  ],
  theme: {
    container: {
      center: true,
      padding: {
        '2xl': '2rem',
        DEFAULT: '1rem',
        lg: '2rem',
        md: '2rem',
        sm: '1rem',
        xl: '2rem',
      },
      screens: {
        '2xl': '86rem',
        lg: '64rem',
        md: '48rem',
        sm: '40rem',
        xl: '80rem',
      },
    },
    extend: {
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        background: 'hsl(var(--background))',
        border: 'hsla(var(--border))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        foreground: 'hsl(var(--foreground))',
        input: 'hsl(var(--input))',
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        ring: 'hsl(var(--ring))',
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        success: 'hsl(var(--success))',
        error: 'hsl(var(--error))',
        warning: 'hsl(var(--warning))',
        // PetPal-inspired colors
        'golden-yellow': '#FFC857',
        'pastel-pink': '#F8D7E3',
        'pastel-mint': '#E8F5E8',
        'pastel-blue': '#E3F2FD',
        'pastel-lavender': '#F3E5F5',
        'pastel-yellow': '#FFF8E1',
        // Custom theme colors
        'golf-green': '#48BB78',
        'golf-gray': '#2D3748',
        'golf-background': '#F8F9FA',
      },
      fontFamily: {
        mono: ['var(--font-geist-mono)'],
        sans: ['var(--font-noto-sans-jp)', 'var(--font-geist-sans)', 'Hiragino Sans', 'Yu Gothic', 'sans-serif'],
        'noto-jp': ['var(--font-noto-sans-jp)', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-hero': 'linear-gradient(135deg, #F8D7E3 0%, #F3E5F5 100%)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      typography: () => ({
        DEFAULT: {
          css: [
            {
              '--tw-prose-body': '#212121',
              '--tw-prose-headings': '#212121',
              '--tw-prose-lead': '#404040',
              '--tw-prose-links': '#357A35',
              '--tw-prose-bold': '#212121',
              '--tw-prose-counters': '#404040',
              '--tw-prose-bullets': '#404040',
              '--tw-prose-hr': '#e5e5e5',
              '--tw-prose-quotes': '#212121',
              '--tw-prose-quote-borders': '#e5e5e5',
              '--tw-prose-captions': '#404040',
              '--tw-prose-code': '#212121',
              '--tw-prose-pre-code': '#e5e5e5',
              '--tw-prose-pre-bg': '#1f2937',
              '--tw-prose-th-borders': '#d1d5db',
              '--tw-prose-td-borders': '#e5e5e5',
              color: '#212121',
              h1: {
                fontWeight: 'normal',
                marginBottom: '0.25em',
                color: '#212121',
              },
              h2: {
                color: '#212121',
              },
              h3: {
                color: '#212121',
              },
              p: {
                color: '#212121',
              },
              strong: {
                color: '#212121',
              },
              a: {
                color: '#357A35',
                '&:hover': {
                  color: '#2a5f2a',
                },
              },
            },
          ],
        },
        base: {
          css: [
            {
              h1: {
                fontSize: '2.5rem',
              },
              h2: {
                fontSize: '1.25rem',
                fontWeight: 600,
              },
            },
          ],
        },
        md: {
          css: [
            {
              h1: {
                fontSize: '3.5rem',
              },
              h2: {
                fontSize: '1.5rem',
              },
            },
          ],
        },
      }),
    },
  },
}

export default config
