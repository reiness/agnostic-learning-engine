/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class', 'class'],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			'light-primary': '#FFFFFF',
  			'light-secondary': '#F2F2F2',
  			'dark-primary': '#0D1117',
  			'dark-secondary': '#161B22',
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			'text-light-primary': '#000000',
  			'text-light-secondary': '#555555',
  			'text-dark-primary': '#C9D1D9',
  			'text-dark-secondary': '#8B949E',
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  				     flashcard: {
  				         '1': 'hsl(var(--flashcard-1))',
  				         '2': 'hsl(var(--flashcard-2))',
  				         '3': 'hsl(var(--flashcard-3))',
  				         '4': 'hsl(var(--flashcard-4))',
  				         'red': 'hsl(var(--flashcard-red))',
  				     }
  		},
  			borderRadius: {
  				lg: 'var(--radius)',
  				md: 'calc(var(--radius) - 2px)',
  				sm: 'calc(var(--radius) - 4px)'
  			},
  	     typography: ({ theme }) => ({
  	       DEFAULT: {
  	         css: {
  	           color: theme('colors.foreground'),
  	           'h1, h2, h3, h4': {
  	             color: theme('colors.foreground'),
  	           },
  	           p: {
  	             color: theme('colors.foreground'),
  	           },
  	           li: {
  	             color: theme('colors.foreground'),
  	           },
  	           blockquote: {
  	             color: theme('colors.muted-foreground'),
  	           },
  	           code: {
  	             color: theme('colors.foreground'),
  	             backgroundColor: theme('colors.secondary'),
  	           },
  	           strong: {
  	             color: theme('colors.foreground'),
  	           },
  	           a: {
  	             color: theme('colors.primary'),
  	             '&:hover': {
  	               color: theme('colors.primary-foreground'),
  	             },
  	           },
  	         },
  	       },
  	       invert: {
  	         css: {
  	           color: theme('colors.foreground'),
  	           'h1, h2, h3, h4': {
  	             color: theme('colors.foreground'),
  	           },
  	           p: {
  	             color: theme('colors.foreground'),
  	           },
  	           li: {
  	             color: theme('colors.foreground'),
  	           },
  	           blockquote: {
  	             color: theme('colors.muted-foreground'),
  	           },
  	           code: {
  	             color: theme('colors.foreground'),
  	             backgroundColor: theme('colors.secondary'),
  	           },
  	           strong: {
  	             color: theme('colors.foreground'),
  	           },
  	           a: {
  	             color: theme('colors.primary'),
  	             '&:hover': {
  	               color: theme('colors.primary-foreground'),
  	             },
  	           },
  	         },
  	       },
  	     }),
  	}
  },
  plugins: [
    require('@tailwindcss/typography'),
      require("tailwindcss-animate")
],
}