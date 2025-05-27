import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

// ライト/ダークモード用のテーマカラーを定義
const themes = {
  light: {
    header: '#ffffff',
    background: '#f5f5f5',
    text: '#000000',
    card: '#ffffff',
    border: '#e0e0e0',
    // 他の色も必要に応じて追加
  },
  dark: {
    header: '#000000',
    background: '#000000',
    text: '#ffffff',
    card: '#1e1e1e',
    border: '#2c2c2c',
    // 他の色も必要に応じて追加
  }
};

type ThemeType = typeof themes.light;
const ThemeContext = createContext<ThemeType>(themes.light);

export const ThemeProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [theme, setTheme] = useState<ThemeType>(themes[systemColorScheme || 'light']);

  // システムのカラースキームが変更されたときにテーマを更新
  useEffect(() => {
    setTheme(themes[systemColorScheme || 'light']);
  }, [systemColorScheme]);

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);