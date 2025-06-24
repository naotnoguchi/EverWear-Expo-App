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
    primary: '#3498db',      // 追加
    secondary: '#95a5a6',    // 追加
    textSecondary: '#757575', // 追加 - 二次テキスト用のグレー
    tabBackground: '#ffffff',
    tabButton: '#f5f5f5',
    success: '#27ae60',      // 追加
    warning: '#f39c12',      // 追加
    error: '#e74c3c',        // 追加
  },
  dark: {
    header: '#000000',
    background: '#000000',
    text: '#ffffff',
    card: '#1e1e1e',
    border: '#2c2c2c',
    primary: '#3498db',      // 追加
    secondary: '#7f8c8d',    // 追加
    textSecondary: '#9e9e9e', // 追加 - 二次テキスト用のグレー（暗い背景に対して読みやすい）
    tabBackground: '#000000',
    tabButton: '#1e1e1e',
    success: '#27ae60',      // 追加
    warning: '#f39c12',      // 追加
    error: '#e74c3c',        // 追加
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
