import { createContext, useContext, useEffect, useState } from 'react';

const themes = {
  green: {
    name: 'Copper Mineral Green',
    primary: '#398178',
    accent: '#E0873B',
    secondary: '#252737'
  },
  orange: {
    name: 'Texas Longhorn',
    primary: '#E0873B',
    accent: '#398178',
    secondary: '#252737'
  },
  steel: {
    name: 'Cold Steel',
    primary: '#252737',
    accent: '#E0873B',
    secondary: '#398178'
  }
};

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('app-theme') || 'green';
  });

  useEffect(() => {
    const root = document.documentElement;
    const themeObj = themes[currentTheme];
    
    root.style.setProperty('--theme-primary', themeObj.primary);
    root.style.setProperty('--theme-accent', themeObj.accent);
    root.style.setProperty('--theme-secondary', themeObj.secondary);
    
    localStorage.setItem('app-theme', currentTheme);
  }, [currentTheme]);

  const switchTheme = (themeName) => {
    if (themes[themeName]) {
      setCurrentTheme(themeName);
    }
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, switchTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
};
