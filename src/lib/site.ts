// Marca, contacto y datos legales en un solo lugar. Se pueden sobrescribir con variables NEXT_PUBLIC_* (ver .env.example)
// sin tocar código. Los textos legales deben ser revisados por el asesor jurídico del despacho antes de operar.
export const site = {
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? 'Imperial Law Group',
  tagline: 'Recuperación de capital con respaldo jurídico',
  // Sede y alcance: se muestran en la portada, el pie y los textos legales.
  headquarters: 'Miami, Florida',
  reach: 'Atendemos a clientes de toda Latinoamérica',
  supportEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'contacto@imperiallawgroup.example',
  currency: 'USD',
  locale: 'es-US',
  legal: {
    entityName: process.env.NEXT_PUBLIC_LEGAL_ENTITY ?? process.env.NEXT_PUBLIC_SITE_NAME ?? 'Imperial Law Group',
    // El despacho está en Miami y atiende a clientes de toda Latinoamérica. Agrega la dirección completa con NEXT_PUBLIC_LEGAL_ADDRESS.
    address: process.env.NEXT_PUBLIC_LEGAL_ADDRESS ?? 'Miami, Florida, Estados Unidos de América',
    city: 'Miami, Florida, EE. UU.',
    privacyEmail: process.env.NEXT_PUBLIC_PRIVACY_EMAIL ?? 'privacidad@imperiallawgroup.example',
    // Debe coincidir con PRIVACY_VERSION de la API (apps/api/src/common/legal.ts).
    privacyVersion: '2026-10-05',
    privacyUpdated: '5 de octubre de 2026',
  },
};
