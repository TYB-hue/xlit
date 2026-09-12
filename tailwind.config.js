/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#1a1a1a',        // page background — reference charcoal tone
        card: '#17181b',       // raised card surface
        cardmuted: '#141518',  // inset / nested card surface
        stroke: '#2a2b2f',     // hairline borders on dark cards
        ink: '#f4f4f2',        // primary text (off-white, not pure white)
        inkdim: '#9a9ba3',     // secondary / muted text
        lime: '#d7f24e',       // the chartreuse accent from the source
        limedim: '#c7e23e',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        hero: ['64px', { lineHeight: '1.08', letterSpacing: '-0.02em' }],
      },
      boxShadow: {
        soft: '0 20px 60px -20px rgba(0,0,0,0.6)',
        card: '0 12px 30px -12px rgba(0,0,0,0.5)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        glow: {
          '0%, 100%': { opacity: '0.35' },
          '50%': { opacity: '0.6' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        floatSlow: 'floatSlow 8s ease-in-out infinite',
        glow: 'glow 5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
