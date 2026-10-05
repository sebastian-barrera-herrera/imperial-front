'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { cookies } from 'next/headers';

/** Refresca la landing para que muestre al instante los cambios hechos en el panel. Solo con sesión iniciada. */
export async function refreshPublicSite() {
  if (!(await cookies()).has('ilg_at')) return;
  revalidateTag('content');
  revalidatePath('/');
}
