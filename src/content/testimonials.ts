// Testimonios mostrados en la landing.
// CONTENIDO DE EJEMPLO: son textos ilustrativos, no opiniones de clientes reales. Sustitúyelos por testimonios reales
// (con autorización escrita de cada cliente) antes de publicar. No se usan fotos de archivo para estos perfiles a propósito:
// una foto de una persona real junto a una cita implicaría que esa persona avala al despacho.
export type Testimonial = { quote: string; author: string; kind: string };

export const testimonials: Testimonial[] = [
  { quote: 'Subir mis documentos y saber ese mismo día si estaban completos me quitó mucha incertidumbre.', author: 'M. R.', kind: 'Cliente' },
  { quote: 'Cada cambio en mi solicitud me llegó como una alerta. Nunca tuve que llamar para preguntar en qué etapa iba.', author: 'J. T.', kind: 'Cliente' },
  { quote: 'Ver el valor de mi inversión actualizado, con su historial, me da claridad para tomar decisiones.', author: 'L. P.', kind: 'Inversionista' },
];
