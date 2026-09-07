export const THEME = {
  colors: {
    primary: '#ef4623',
    secondary: '#333d47',
    tertiary: '#f4f5f7',
    neutral: '#717d8a',
    background: '#ffffff',
    surface: '#f7f9ff',
    error: '#ba1a1a',
    success: '#10b981',
    border: '#eeeeee',
  },
  typography: {
    fontFamily: {
      heading: '"Libre Caslon Text", serif',
      body: '"Hanken Grotesk", sans-serif',
    },
    fontSize: {
      displayLg: '56px',
      headlineLg: '32px',
      titleMd: '20px',
      bodyLg: '22px',
      bodyMd: '16px',
      labelSm: '12px',
      button: '14px',
    },
  },
  spacing: {
    sidebarWidth: '260px',
    contentMaxWidth: '1200px',
    gutter: '24px',
    marginPage: '48px',
    stackSm: '8px',
    stackMd: '16px',
    stackLg: '32px',
  },
  shape: {
    borderRadius: {
      sm: '4px',
      md: '8px',
      pill: '9999px',
    },
  },
} as const;
