tailwind.config = {
  theme: {
    extend: {
      screens: {
        'xs': '400px',
      },
      colors: {
        primary: {
          DEFAULT: '#B03A2E',
          dark: '#8E2920',
          light: 'rgba(176, 58, 46, 0.1)',
        },
        bg: {
          DEFAULT: '#f7f3f0',
          white: '#ffffff',
        },
        text: {
          DEFAULT: '#2c2c2c',
          muted: '#444444',
          light: '#888888',
        },
        border: '#ede8e3',
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        body: ['Inter', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
      },
      boxShadow: {
        'sm': '0 2px 8px rgba(0, 0, 0, 0.06)',
        'md': '0 4px 16px rgba(0, 0, 0, 0.10)',
        'lg': '0 8px 28px rgba(0, 0, 0, 0.15)',
      }
    }
  }
}

