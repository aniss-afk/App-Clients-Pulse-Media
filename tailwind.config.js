/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        /* La charte de l'agence, à l'identique. Une marque qui reçoit un
           rapport signé Pulse Media doit reconnaître l'objet quand elle
           ouvre son espace. */
        cream: '#F1EDE3',
        paper: '#FFFDF9',
        inset: '#F4F0E6',
        deep: '#E7E1D5',

        ink: '#12110F',
        'ink-muted': '#575450',
        'ink-faint': '#85817A',

        /* Le rouge est un aplat et une marque, jamais du texte en petit
           corps : sur le crème il plafonne à 3,1:1. C'est `red-ink` qui
           porte les mots. */
        red: '#FF3B30',
        'red-ink': '#B32419',
        'red-pale': '#FFE9E6',
        'red-soft': '#FFD2CC',

        line: 'rgba(18,17,15,0.08)',
        'line-strong': 'rgba(18,17,15,0.16)',

        success: '#1F7A4D',
        'success-bg': 'rgba(31,122,77,0.09)',
        warning: '#8A5A00',
        'warning-bg': 'rgba(138,90,0,0.09)',
        info: '#1F5C99',
        'info-bg': 'rgba(31,92,153,0.08)',
      },

      fontFamily: {
        sans: ['Archivo', 'system-ui', '-apple-system', 'sans-serif'],
      },

      fontSize: {
        micro: ['11px', { lineHeight: '1.3', letterSpacing: '0.05em' }],
        xs: ['12px', { lineHeight: '1.45' }],
        sm: ['13px', { lineHeight: '1.5' }],
        base: ['14px', { lineHeight: '1.55' }],
        md: ['15px', { lineHeight: '1.55' }],
        lg: ['17px', { lineHeight: '1.4' }],
        xl: ['20px', { lineHeight: '1.3' }],
        '2xl': ['24px', { lineHeight: '1.2' }],
        '3xl': ['30px', { lineHeight: '1.1' }],
      },

      borderRadius: { card: '14px', box: '12px', pill: '999px' },

      boxShadow: {
        card: '0 1px 2px rgba(18,17,15,0.04), 0 1px 1px rgba(18,17,15,0.03)',
        lift: '0 2px 4px rgba(18,17,15,0.05), 0 8px 20px -8px rgba(18,17,15,0.12)',
      },

      animation: { rise: 'rise 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards' },
      keyframes: {
        rise: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
