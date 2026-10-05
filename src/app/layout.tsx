import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { themeInitScript } from '@/components/ThemeToggle';
import { ToastProvider } from '@/components/toast';
import { AuthProvider } from '@/lib/auth';
import { site } from '@/lib/site';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: { default: `${site.name} · ${site.tagline}`, template: `%s · ${site.name}` },
  description: 'Plataforma para gestionar tu caso, cargar documentos, solicitar desembolsos y seguir cada etapa de la recuperación de tu capital.',
  openGraph: { siteName: site.name, locale: 'es_US', type: 'website' },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <ToastProvider>
          <AuthProvider>{children}</AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
