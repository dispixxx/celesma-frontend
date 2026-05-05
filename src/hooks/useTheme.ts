import { useEffect } from 'react';

export type Theme = 'light' | 'dark' | 'monodark' | 'mirror' | 'cosmic';
export type FontSize = 'small' | 'medium' | 'large';

const FONT_SIZES: Record<FontSize, string> = {
  small: '14px',
  medium: '16px',
  large: '18px',
};

export function useTheme() {
  useEffect(() => {
    const theme = (localStorage.getItem('theme') as Theme) || 'light';
    const fontSize = (localStorage.getItem('fontSize') as FontSize) || 'medium';

    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.fontSize = FONT_SIZES[fontSize];
  }, []);
}

export function setTheme(theme: Theme) {
  localStorage.setItem('theme', theme);
  document.documentElement.setAttribute('data-theme', theme);
}

export function setFontSize(size: FontSize) {
  localStorage.setItem('fontSize', size);
  document.documentElement.style.fontSize = FONT_SIZES[size];
}

export function getTheme(): Theme {
  return (localStorage.getItem('theme') as Theme) || 'light';
}

export function getFontSize(): FontSize {
  return (localStorage.getItem('fontSize') as FontSize) || 'medium';
}
