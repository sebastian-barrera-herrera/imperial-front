'use client';

import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { Avatar } from '@/components/Avatar';
import { Badge, Button } from '@/components/ui';

type Props = {
  name: string;
  photoUrl: string | null;
  title?: string;
  children: ReactNode;
  published: boolean;
  isSample: boolean;
  first: boolean;
  last: boolean;
  onMove: (dir: -1 | 1) => void;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
};

/** Fila de un perfil o testimonio con sus acciones (orden, editar, ocultar, eliminar). */
export function ContentCard({ name, photoUrl, title, children, published, isSample, first, last, onMove, onEdit, onToggle, onDelete }: Props) {
  return (
    <li className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-start">
      <Avatar name={name} src={photoUrl ?? undefined} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-sans text-base font-semibold text-slate-900">{name}</h3>
          {title && <span className="text-sm text-slate-500">{title}</span>}
          <Badge tone={published ? 'green' : 'slate'}>{published ? 'Publicado' : 'Oculto'}</Badge>
          {isSample && <Badge tone="amber">Ejemplo</Badge>}
        </div>
        <div className="mt-1 text-sm text-slate-600">{children}</div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-1">
        <Button variant="ghost" className="px-2" onClick={() => onMove(-1)} disabled={first} aria-label={`Subir a ${name}`}><ArrowUp className="h-4 w-4" aria-hidden /></Button>
        <Button variant="ghost" className="px-2" onClick={() => onMove(1)} disabled={last} aria-label={`Bajar a ${name}`}><ArrowDown className="h-4 w-4" aria-hidden /></Button>
        <Button variant="ghost" className="px-2" onClick={onToggle} aria-label={published ? `Ocultar a ${name}` : `Publicar a ${name}`}>{published ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}</Button>
        <Button variant="outline" onClick={onEdit}><Pencil className="h-4 w-4" aria-hidden /> Editar</Button>
        <Button variant="ghost" className="px-2 text-red-700" onClick={onDelete} aria-label={`Eliminar a ${name}`}><Trash2 className="h-4 w-4" aria-hidden /></Button>
      </div>
    </li>
  );
}
