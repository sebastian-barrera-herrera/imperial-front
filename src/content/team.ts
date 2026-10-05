// Perfiles del equipo mostrados en la landing.
// CONTENIDO DE EJEMPLO: nombres y descripciones ilustrativos. Reemplázalos por el equipo real antes de publicar.
// Para añadir una foto: copia el archivo en apps/web/public/images/team/ y pon su ruta en `photo` (p. ej. '/images/team/elena.jpg').
export type TeamMember = { name: string; role: string; bio: string; photo?: string };

export const team: TeamMember[] = [
  { name: 'Dra. Elena Marín', role: 'Socia directora', bio: 'Dirige la estrategia de los casos de recuperación de capital y supervisa cada expediente.' },
  { name: 'Dr. Andrés Salgado', role: 'Abogado senior · litigio y cobranza', bio: 'Lleva las negociaciones y los procesos de recuperación ante contrapartes y juzgados.' },
  { name: 'Dra. Valeria Ortiz', role: 'Abogada asociada · contratos', bio: 'Revisa los soportes documentales y verifica que cada caso cumpla los requisitos.' },
  { name: 'Camilo Reyes', role: 'Atención al cliente', bio: 'Te acompaña con tus dudas sobre documentos, solicitudes y el uso de la plataforma.' },
];
