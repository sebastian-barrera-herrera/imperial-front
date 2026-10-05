import { team as fallbackTeam } from '@/content/team';
import { testimonials as fallbackTestimonials } from '@/content/testimonials';

export type PublicTeamMember = { id: string; name: string; role: string; bio: string; photoUrl: string | null; isSample: boolean };
export type PublicTestimonial = { id: string; quote: string; author: string; kind: string; photoUrl: string | null; isSample: boolean };
export type SiteContent = { team: PublicTeamMember[]; testimonials: PublicTestimonial[] };

const API_URL = process.env.API_URL ?? 'http://localhost:4000';

/**
 * Equipo y testimonios de la landing. Vienen de la API (los edita el superadmin en el panel); si la API no responde o la
 * sección aún no se ha configurado, se usa el contenido de respaldo de `src/content/`, siempre rotulado como ilustrativo.
 */
export async function getSiteContent(): Promise<SiteContent> {
  let remote: { team: PublicTeamMember[] | null; testimonials: PublicTestimonial[] | null } | null = null;
  try {
    const res = await fetch(`${API_URL}/api/public/content`, { next: { revalidate: 30, tags: ['content'] }, signal: AbortSignal.timeout(4000) });
    if (res.ok) remote = await res.json();
  } catch {
    // Sin API (p. ej. durante el build): se usa el respaldo.
  }
  return {
    team: remote?.team ?? fallbackTeam.map((m, i) => ({ id: `sample-${i}`, ...m, photoUrl: m.photo ?? null, isSample: true })),
    testimonials: remote?.testimonials ?? fallbackTestimonials.map((t, i) => ({ id: `sample-${i}`, ...t, photoUrl: null, isSample: true })),
  };
}
