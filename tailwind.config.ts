import type { Config } from 'tailwindcss';

// Los colores leen variables CSS (ver globals.css) para soportar tema claro y oscuro.
// `night` es una escala fija (no cambia con el tema) para superficies siempre oscuras: sidebar, hero, panel de login.
const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        slate: { 50: 'rgb(var(--slate-50) / <alpha-value>)', 100: 'rgb(var(--slate-100) / <alpha-value>)', 200: 'rgb(var(--slate-200) / <alpha-value>)', 300: 'rgb(var(--slate-300) / <alpha-value>)', 400: 'rgb(var(--slate-400) / <alpha-value>)', 500: 'rgb(var(--slate-500) / <alpha-value>)', 600: 'rgb(var(--slate-600) / <alpha-value>)', 700: 'rgb(var(--slate-700) / <alpha-value>)', 800: 'rgb(var(--slate-800) / <alpha-value>)', 900: 'rgb(var(--slate-900) / <alpha-value>)', 950: 'rgb(var(--slate-950) / <alpha-value>)' },
        navy: { 50: 'rgb(var(--navy-50) / <alpha-value>)', 100: 'rgb(var(--navy-100) / <alpha-value>)', 200: 'rgb(var(--navy-200) / <alpha-value>)', 300: 'rgb(var(--navy-300) / <alpha-value>)', 400: 'rgb(var(--navy-400) / <alpha-value>)', 500: 'rgb(var(--navy-500) / <alpha-value>)', 600: 'rgb(var(--navy-600) / <alpha-value>)', 700: 'rgb(var(--navy-700) / <alpha-value>)', 800: 'rgb(var(--navy-800) / <alpha-value>)', 900: 'rgb(var(--navy-900) / <alpha-value>)', 950: 'rgb(var(--navy-950) / <alpha-value>)' },
        gold: { 50: 'rgb(var(--gold-50) / <alpha-value>)', 100: 'rgb(var(--gold-100) / <alpha-value>)', 200: 'rgb(var(--gold-200) / <alpha-value>)', 300: 'rgb(var(--gold-300) / <alpha-value>)', 400: 'rgb(var(--gold-400) / <alpha-value>)', 500: 'rgb(var(--gold-500) / <alpha-value>)', 600: 'rgb(var(--gold-600) / <alpha-value>)', 700: 'rgb(var(--gold-700) / <alpha-value>)', 800: 'rgb(var(--gold-800) / <alpha-value>)', 900: 'rgb(var(--gold-900) / <alpha-value>)', 950: 'rgb(var(--gold-950) / <alpha-value>)' },
        green: { 50: 'rgb(var(--green-50) / <alpha-value>)', 100: 'rgb(var(--green-100) / <alpha-value>)', 200: 'rgb(var(--green-200) / <alpha-value>)', 300: 'rgb(var(--green-300) / <alpha-value>)', 400: 'rgb(var(--green-400) / <alpha-value>)', 500: 'rgb(var(--green-500) / <alpha-value>)', 600: 'rgb(var(--green-600) / <alpha-value>)', 700: 'rgb(var(--green-700) / <alpha-value>)', 800: 'rgb(var(--green-800) / <alpha-value>)', 900: 'rgb(var(--green-900) / <alpha-value>)' },
        red: { 50: 'rgb(var(--red-50) / <alpha-value>)', 100: 'rgb(var(--red-100) / <alpha-value>)', 200: 'rgb(var(--red-200) / <alpha-value>)', 300: 'rgb(var(--red-300) / <alpha-value>)', 400: 'rgb(var(--red-400) / <alpha-value>)', 500: 'rgb(var(--red-500) / <alpha-value>)', 600: 'rgb(var(--red-600) / <alpha-value>)', 700: 'rgb(var(--red-700) / <alpha-value>)', 800: 'rgb(var(--red-800) / <alpha-value>)', 900: 'rgb(var(--red-900) / <alpha-value>)' },
        amber: { 50: 'rgb(var(--amber-50) / <alpha-value>)', 100: 'rgb(var(--amber-100) / <alpha-value>)', 200: 'rgb(var(--amber-200) / <alpha-value>)', 300: 'rgb(var(--amber-300) / <alpha-value>)', 400: 'rgb(var(--amber-400) / <alpha-value>)', 500: 'rgb(var(--amber-500) / <alpha-value>)', 600: 'rgb(var(--amber-600) / <alpha-value>)', 700: 'rgb(var(--amber-700) / <alpha-value>)', 800: 'rgb(var(--amber-800) / <alpha-value>)', 900: 'rgb(var(--amber-900) / <alpha-value>)' },
        blue: { 50: 'rgb(var(--blue-50) / <alpha-value>)', 100: 'rgb(var(--blue-100) / <alpha-value>)', 200: 'rgb(var(--blue-200) / <alpha-value>)', 300: 'rgb(var(--blue-300) / <alpha-value>)', 400: 'rgb(var(--blue-400) / <alpha-value>)', 500: 'rgb(var(--blue-500) / <alpha-value>)', 600: 'rgb(var(--blue-600) / <alpha-value>)', 700: 'rgb(var(--blue-700) / <alpha-value>)', 800: 'rgb(var(--blue-800) / <alpha-value>)', 900: 'rgb(var(--blue-900) / <alpha-value>)' },
        night: { 50: '#f2f5f8', 100: '#e3ebf2', 200: '#c9d9e8', 300: '#a1bdd9', 400: '#779fc5', 500: '#5383b2', 600: '#426c94', 700: '#345879', 800: '#284662', 900: '#1d344a', 950: '#111f2c' },
        cream: '#f9f8e1',
        series: { 1: 'rgb(var(--series-1) / <alpha-value>)', 2: 'rgb(var(--series-2) / <alpha-value>)' },
        // Acento dorado fijo (no cambia con el tema): `accent` para fondos con texto oscuro, `accent-strong` para fondos con texto blanco (AA), `accent-light` para texto dorado sobre superficies oscuras fijas (`night`).
        accent: { DEFAULT: '#b8903f', strong: '#7a5a28', light: '#dcbb6c' },
        surface: 'rgb(var(--surface) / <alpha-value>)',
        paper: 'rgb(var(--paper) / <alpha-value>)',
        brand: { DEFAULT: 'rgb(var(--brand) / <alpha-value>)', hover: 'rgb(var(--brand-hover) / <alpha-value>)' },
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', '"Times New Roman"', 'serif'],
      },
    },
  },
  plugins: [],
};

export default config;
