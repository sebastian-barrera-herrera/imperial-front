'use client';

import { Search } from 'lucide-react';
import { useState } from 'react';
import { useDebounced, useFetch, qs } from '@/lib/hooks';
import type { Paged } from '@/lib/types';
import { Spinner, cn } from './ui';

type ClientRow = { id: string; fullName: string; email: string };

/** Buscador de clientes por nombre o correo (usa el directorio del personal). */
export function ClientPicker({ value, onChange }: { value: ClientRow | null; onChange: (c: ClientRow | null) => void }) {
  const [search, setSearch] = useState('');
  const debounced = useDebounced(search);
  const { data, loading } = useFetch<Paged<ClientRow>>(`/admin/clients${qs({ search: debounced, pageSize: 8 })}`);

  if (value) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm">
        <span><strong>{value.fullName}</strong> <span className="text-slate-500">· {value.email}</span></span>
        <button type="button" className="text-xs font-medium text-navy-700 underline" onClick={() => onChange(null)}>Cambiar</button>
      </div>
    );
  }
  return (
    <div>
      <div className="relative"><Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" aria-hidden />
        <input className="input pl-9" placeholder="Buscar cliente por nombre o correo…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Buscar cliente" /></div>
      <ul className={cn('mt-1 max-h-44 overflow-y-auto rounded-lg border border-slate-200', !data?.items.length && !loading && 'p-3')}>
        {loading && <li className="flex items-center gap-2 p-3 text-sm text-slate-500"><Spinner /> Buscando…</li>}
        {data?.items.map((c) => (
          <li key={c.id}><button type="button" className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50" onClick={() => onChange(c)}><span className="font-medium">{c.fullName}</span> <span className="text-slate-500">· {c.email}</span></button></li>
        ))}
        {!loading && data?.items.length === 0 && <li className="text-sm text-slate-500">Sin resultados.</li>}
      </ul>
    </div>
  );
}
