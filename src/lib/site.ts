// Marca, contacto y datos legales en un solo lugar. Se pueden sobrescribir con variables NEXT_PUBLIC_* (ver .env.example)
// sin tocar código. Los textos legales deben ser revisados por el asesor jurídico del despacho antes de operar.
export const site = {
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? 'Imperial Law Group',
  tagline: 'Recuperación de capital con respaldo jurídico',
  supportEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'contacto@imperiallawgroup.example',
  // Muestra la etiqueta de "contenido ilustrativo" junto al equipo y los testimonios. Ponla en 'false' cuando el contenido sea real.
  showSampleNotice: process.env.NEXT_PUBLIC_SAMPLE_CONTENT !== 'false',
  currency: 'USD',
  locale: 'es-US',
  legal: {
    entityName: process.env.NEXT_PUBLIC_LEGAL_ENTITY ?? process.env.NEXT_PUBLIC_SITE_NAME ?? 'Imperial Law Group',
    address: process.env.NEXT_PUBLIC_LEGAL_ADDRESS ?? '',
    privacyEmail: process.env.NEXT_PUBLIC_PRIVACY_EMAIL ?? 'privacidad@imperiallawgroup.example',
    // Debe coincidir con PRIVACY_VERSION de la API (apps/api/src/common/legal.ts).
    privacyVersion: '2026-10-05',
    privacyUpdated: '5 de octubre de 2026',
  },
};
