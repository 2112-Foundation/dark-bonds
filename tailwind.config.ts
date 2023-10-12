import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontSize: {
        '15xl': '15.625rem',
        '14xl': '14rem',
        '13xl': '13rem',
        '12xl': '12rem',
        '11xl': '11rem',
        '10xl': '10rem',
        '7.5xl': '5rem',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      colors: {
        'sable-green-text': '#00FF9F',
        'sable-green-secondary-text':'#253a38',
        'sable-green-placeholder': '#182524',
        'sable-green-page-bg':'#141D1D',
        'bond-item-icon-bg':'#43726C',
        'bond-item-icon-txt':'#00FFCB'
      },
    },
  },
  plugins: [],
}
export default config
