import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useThemeStore = create(
  persist(
    (set) => ({
      theme: 'dark', // default theme
      customAccent: null, // default no custom accent
      setTheme: (theme) => set({ theme, customAccent: null }), // reset custom color on theme change
      setCustomAccent: (color) => set({ customAccent: color }),
    }),
    {
      name: 'fitsadhana-theme',
    }
  )
);
