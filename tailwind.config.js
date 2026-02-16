/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./**/*.{js,jsx,ts,tsx}', './node_modules/nativewind/**/*.js'],
	theme: {
		extend: {
			colors: {
				accent: '#2ECC71',
				'accent-soft': 'rgba(46,204,113,0.16)',
				'apple-blue': '#0A84FF',
				'apple-green': '#30D158',
				'apple-red': '#FF453A',
				glass: 'rgba(30, 30, 30, 0.72)',
				'glass-thick': 'rgba(30, 30, 30, 0.88)',
				'glass-thin': 'rgba(44, 44, 46, 0.55)',
				'glass-light': 'rgba(44, 44, 46, 0.4)',
			},
			spacing: {
				xs: '4px',
				sm: '8px',
				md: '12px',
				lg: '16px',
				xl: '20px',
				xxl: '24px',
				xxxl: '32px',
			},
			borderRadius: {
				sm: '8px',
				md: '12px',
				lg: '16px',
				xl: '20px',
				xxl: '24px',
				pill: '999px',
			},
			backdropBlur: {
				xs: '2px',
				sm: '4px',
				md: '12px',
				lg: '20px',
			},
		},
	},
	plugins: [],
};
