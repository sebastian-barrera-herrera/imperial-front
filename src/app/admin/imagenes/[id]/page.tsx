'use client';

import { AlignCenter, AlignLeft, AlignRight, ArrowLeft, Bold, Download, Eye, History, Italic, Save, Trash2, Undo2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { SuperOnly } from '@/components/SuperOnly';
import { useToast } from '@/components/toast';
import { Badge, Button, Card, ErrorBox, Field, PageHeader, PageLoader } from '@/components/ui';
import { downloadFile, uploadFile } from '@/lib/api';
import { dateTime, fileSize } from '@/lib/format';
import { useFetch } from '@/lib/hooks';
import { FONT_LABELS, autoSize, clampBox, detectInk, loadImage, renderEdits, type Align, type Box, type FontKey, type TextEdit } from '@/lib/studio/textEdit';
import type { StudioImageDetail, StudioVersion } from '@/lib/types';

type Pending = Box & { text: string | null; font: FontKey; size: number; color: string; bold: boolean; italic: boolean; align: Align };
type Source = { kind: 'original' } | { kind: 'version'; id: string; version: number };

const MIN_SELECTION = 6;

function Editor() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const detail = useFetch<StudioImageDetail>(`/admin/studio/images/${id}`);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [source, setSource] = useState<Source>({ kind: 'original' });
  const [base, setBase] = useState<HTMLImageElement | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [edits, setEdits] = useState<TextEdit[]>([]);
  const [pending, setPending] = useState<Pending | null>(null);
  const [drag, setDrag] = useState<{ x: number; y: number; box: Box } | null>(null);
  const [compare, setCompare] = useState(false);
  const [label, setLabel] = useState('');
  const [format, setFormat] = useState<'png' | 'jpeg'>('png');
  const [busy, setBusy] = useState<'save' | 'saveDownload' | null>(null);

  // Carga la imagen base (el original o una versión anterior sobre la que seguir trabajando).
  useEffect(() => {
    let cancelled = false;
    setBase(null);
    setLoadError(null);
    const url = source.kind === 'original' ? `/api/admin/studio/images/${id}/original` : `/api/admin/studio/versions/${source.id}`;
    loadImage(url).then((img) => !cancelled && setBase(img)).catch((e: Error) => !cancelled && setLoadError(e.message));
    return () => { cancelled = true; };
  }, [id, source]);

  const previewList = useMemo<TextEdit[]>(() => {
    if (compare) return [];
    return pending && pending.text !== null ? [...edits, { ...pending, text: pending.text } as TextEdit] : edits;
  }, [compare, edits, pending]);

  // Redibuja el lienzo con las ediciones (y la vista previa de la edición pendiente).
  useEffect(() => {
    if (base && canvasRef.current) renderEdits(canvasRef.current, base, previewList);
  }, [base, previewList]);

  /** Convierte las coordenadas del puntero a píxeles de la imagen. */
  const toImage = useCallback((e: PointerEvent): { x: number; y: number } => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const c = canvasRef.current!;
    return { x: ((e.clientX - rect.left) / rect.width) * c.width, y: ((e.clientY - rect.top) / rect.height) * c.height };
  }, []);

  function onPointerDown(e: PointerEvent) {
    if (!base || compare) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const p = toImage(e);
    setDrag({ x: p.x, y: p.y, box: { x: p.x, y: p.y, w: 0, h: 0 } });
  }
  function onPointerMove(e: PointerEvent) {
    if (!drag) return;
    const p = toImage(e);
    setDrag({ ...drag, box: { x: Math.min(drag.x, p.x), y: Math.min(drag.y, p.y), w: Math.abs(p.x - drag.x), h: Math.abs(p.y - drag.y) } });
  }
  function onPointerUp() {
    if (!drag || !base || !canvasRef.current) return setDrag(null);
    const c = canvasRef.current;
    const box = clampBox(drag.box, c.width, c.height);
    setDrag(null);
    if (box.w < MIN_SELECTION || box.h < MIN_SELECTION) return;
    // El color del texto se detecta sobre la imagen con las ediciones ya aplicadas (sin la vista previa pendiente).
    const ctx = renderEdits(c, base, edits);
    setPending({ ...box, text: null, font: 'sans', size: autoSize(box), color: detectInk(ctx, box), bold: false, italic: false, align: 'left' });
  }

  const patch = (p: Partial<Pending>) => setPending((cur) => (cur ? { ...cur, ...p } : cur));
  const setBox = (key: keyof Box, value: number) => {
    if (!pending || !canvasRef.current || !Number.isFinite(value)) return;
    patch(clampBox({ ...pending, [key]: value }, canvasRef.current.width, canvasRef.current.height));
  };

  function apply() {
    if (!pending || pending.text === null) return;
    setEdits((list) => [...list, { x: pending.x, y: pending.y, w: pending.w, h: pending.h, text: pending.text!, font: pending.font, size: pending.size, color: pending.color, bold: pending.bold, italic: pending.italic, align: pending.align }]);
    setPending(null);
  }

  async function save(download: boolean) {
    if (!base || !canvasRef.current || !edits.length) return;
    setBusy(download ? 'saveDownload' : 'save');
    try {
      const canvas = canvasRef.current;
      renderEdits(canvas, base, edits); // sin selección ni vista previa
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('No se pudo generar la imagen'))), `image/${format}`, 0.95));
      const form = new FormData();
      form.append('file', blob, `edicion.${format === 'png' ? 'png' : 'jpg'}`);
      const sobre = source.kind === 'version' ? ` (sobre v${source.version})` : '';
      form.append('label', (label.trim() || `${edits.length} ${edits.length === 1 ? 'cambio' : 'cambios'} de texto${sobre}`).slice(0, 120));
      form.append('edits', JSON.stringify(edits));
      const saved = await uploadFile<{ id: string; version: number }>(`/admin/studio/images/${id}/versions`, form);
      toast.success(`Versión ${saved.version} guardada. El original sigue intacto.`);
      setLabel('');
      await detail.reload();
      if (download) await downloadFile(`/admin/studio/versions/${saved.id}?download=1`, 'imagen-editada');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const continueFrom = (v: StudioVersion) => {
    setEdits([]);
    setPending(null);
    setSource({ kind: 'version', id: v.id, version: v.version });
    toast.success(`Ahora trabajas sobre la versión ${v.version}. Tus próximos cambios se guardarán como una versión nueva.`);
  };

  if (detail.loading && !detail.data) return <PageLoader />;
  if (detail.error || !detail.data) return <ErrorBox message={detail.error ?? 'Imagen no encontrada'} onRetry={detail.reload} />;
  const img = detail.data;
  const c = canvasRef.current;
  const pct = (v: number, total: number) => `${(v / total) * 100}%`;
  const overlay = drag?.box.w ? drag.box : pending;

  return (
    <>
      <Link href="/admin/imagenes" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-navy-800"><ArrowLeft className="h-4 w-4" aria-hidden /> Volver a mis imágenes</Link>
      <PageHeader title={img.title} description="Arrastra sobre el texto que quieres cambiar para seleccionarlo, escribe el texto nuevo y aplícalo. El original nunca se modifica: cada guardado crea una versión nueva." />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Card className="p-3">
            {loadError ? <ErrorBox message={loadError} /> : !base ? <PageLoader /> : (
              <div className="relative mx-auto w-full select-none overflow-hidden rounded-lg bg-slate-100" style={{ maxWidth: Math.min(base.naturalWidth, 1100), touchAction: 'none', cursor: compare ? 'default' : 'crosshair' }}
                onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={() => setDrag(null)}>
                <canvas ref={canvasRef} className="block h-auto w-full" role="img" aria-label={`Vista de la imagen ${img.title}${compare ? ' (original)' : ''}`} />
                {overlay && c && !compare && (
                  <div aria-hidden className="pointer-events-none absolute border-2 border-dashed border-accent bg-accent/10"
                    style={{ left: pct(overlay.x, c.width), top: pct(overlay.y, c.height), width: pct(overlay.w, c.width), height: pct(overlay.h, c.height) }} />
                )}
              </div>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={() => setEdits((l) => l.slice(0, -1))} disabled={!edits.length}><Undo2 className="h-4 w-4" aria-hidden /> Deshacer</Button>
              <Button variant="outline" onClick={() => { setEdits([]); setPending(null); }} disabled={!edits.length && !pending}>Descartar cambios</Button>
              <label className="ml-auto inline-flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" className="h-4 w-4 rounded border-slate-300" checked={compare} onChange={(e) => setCompare(e.target.checked)} /> <Eye className="h-4 w-4" aria-hidden /> Ver imagen base
              </label>
            </div>
            {source.kind === 'version' && <p className="mt-2 text-xs text-slate-600">Base: <strong>versión {source.version}</strong>. <button className="underline" onClick={() => { setEdits([]); setPending(null); setSource({ kind: 'original' }); }}>Volver al original</button></p>}
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="p-4">
            <h2 className="text-base font-semibold">Texto nuevo</h2>
            {!pending ? (
              <p className="mt-2 text-sm text-slate-600">Selecciona con el ratón (o el dedo) la zona del texto que quieres reemplazar. Ajusta la caja para que cubra solo ese texto.</p>
            ) : (
              <div className="mt-3 space-y-3">
                <Field label="Reemplazar por" hint="Déjalo vacío para borrar el texto">{(fid) => <input id={fid} className="input" autoFocus value={pending.text ?? ''} maxLength={300} onChange={(e) => patch({ text: e.target.value })} placeholder="Escribe el texto nuevo" />}</Field>
                <Field label="Tipo de letra">{(fid) => <select id={fid} className="input" value={pending.font} onChange={(e) => patch({ font: e.target.value as FontKey })}>{Object.entries(FONT_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>}</Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Tamaño (px)">{(fid) => <input id={fid} type="number" min={1} max={2000} className="input" value={pending.size} onChange={(e) => patch({ size: Math.max(1, Number(e.target.value) || 1) })} />}</Field>
                  <Field label="Color">{(fid) => <input id={fid} type="color" className="h-[38px] w-full cursor-pointer rounded-lg border border-slate-300 bg-surface p-1" value={pending.color} onChange={(e) => patch({ color: e.target.value })} />}</Field>
                </div>
                <div className="flex flex-wrap gap-1" role="group" aria-label="Estilo">
                  <Button type="button" variant={pending.bold ? 'primary' : 'outline'} className="px-3" aria-pressed={pending.bold} aria-label="Negrita" onClick={() => patch({ bold: !pending.bold })}><Bold className="h-4 w-4" aria-hidden /></Button>
                  <Button type="button" variant={pending.italic ? 'primary' : 'outline'} className="px-3" aria-pressed={pending.italic} aria-label="Cursiva" onClick={() => patch({ italic: !pending.italic })}><Italic className="h-4 w-4" aria-hidden /></Button>
                  {([['left', AlignLeft, 'Alinear a la izquierda'], ['center', AlignCenter, 'Centrar'], ['right', AlignRight, 'Alinear a la derecha']] as const).map(([a, Icon, text]) => (
                    <Button key={a} type="button" variant={pending.align === a ? 'primary' : 'outline'} className="px-3" aria-pressed={pending.align === a} aria-label={text} onClick={() => patch({ align: a })}><Icon className="h-4 w-4" aria-hidden /></Button>
                  ))}
                  <Button type="button" variant="ghost" onClick={() => patch({ size: autoSize(pending) })}>Tamaño automático</Button>
                </div>
                <fieldset>
                  <legend className="mb-1 text-xs font-medium text-slate-600">Posición y tamaño de la caja (px)</legend>
                  <div className="grid grid-cols-4 gap-2">
                    {(['x', 'y', 'w', 'h'] as const).map((k) => (
                      <label key={k} className="text-xs text-slate-500">{{ x: 'Izq.', y: 'Arriba', w: 'Ancho', h: 'Alto' }[k]}
                        <input type="number" className="input mt-0.5 px-2 py-1" value={pending[k]} onChange={(e) => setBox(k, Number(e.target.value))} />
                      </label>
                    ))}
                  </div>
                </fieldset>
                <div className="flex gap-2">
                  <Button onClick={apply} disabled={pending.text === null}>Aplicar cambio</Button>
                  <Button variant="outline" onClick={() => setPending(null)}>Cancelar</Button>
                </div>
              </div>
            )}
          </Card>

          <Card className="p-4">
            <h2 className="text-base font-semibold">Cambios aplicados ({edits.length})</h2>
            {edits.length === 0 ? <p className="mt-2 text-sm text-slate-600">Aún no has aplicado cambios.</p> : (
              <ul className="mt-2 divide-y divide-slate-100">
                {edits.map((e, i) => (
                  <li key={i} className="flex items-center gap-2 py-2 text-sm">
                    <span className="min-w-0 flex-1 truncate">{e.text ? `“${e.text}”` : <em className="text-slate-500">Texto borrado</em>}</span>
                    <Button variant="ghost" className="px-2 text-red-700" aria-label={`Quitar el cambio ${i + 1}`} onClick={() => setEdits((l) => l.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" aria-hidden /></Button>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 space-y-3 border-t border-slate-200 pt-4">
              <Field label="Nombre de la versión (opcional)">{(fid) => <input id={fid} className="input" value={label} maxLength={120} onChange={(e) => setLabel(e.target.value)} placeholder="Ej.: Título de octubre" />}</Field>
              <Field label="Formato de descarga">{(fid) => <select id={fid} className="input" value={format} onChange={(e) => setFormat(e.target.value as 'png' | 'jpeg')}><option value="png">PNG (sin pérdida de calidad)</option><option value="jpeg">JPG (más liviano)</option></select>}</Field>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => void save(true)} loading={busy === 'saveDownload'} disabled={!edits.length || busy !== null}><Download className="h-4 w-4" aria-hidden /> Guardar y descargar</Button>
                <Button variant="outline" onClick={() => void save(false)} loading={busy === 'save'} disabled={!edits.length || busy !== null}><Save className="h-4 w-4" aria-hidden /> Solo guardar</Button>
              </div>
              <p className="text-xs text-slate-500">Cada guardado crea una versión nueva y queda registrado. Para descargar siempre se guarda primero.</p>
            </div>
          </Card>

          <Card className="p-4">
            <h2 className="flex items-center gap-2 text-base font-semibold"><History className="h-4 w-4" aria-hidden /> Versiones</h2>
            <ul className="mt-2 divide-y divide-slate-100 text-sm">
              {img.versions.map((v) => (
                <li key={v.id} className="py-2.5">
                  <p className="flex flex-wrap items-center gap-2 font-medium">v{v.version} · {v.label}{source.kind === 'version' && source.id === v.id && <Badge tone="blue">Base actual</Badge>}</p>
                  <p className="text-xs text-slate-500">{dateTime(v.createdAt)}{v.createdByEmail ? ` · ${v.createdByEmail}` : ''} · {fileSize(v.size)}</p>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    <Button variant="outline" className="px-3 py-1 text-xs" onClick={() => void downloadFile(`/admin/studio/versions/${v.id}?download=1`, `${img.title}-v${v.version}`).catch((e) => toast.error((e as Error).message))}><Download className="h-3.5 w-3.5" aria-hidden /> Descargar</Button>
                    <Button variant="ghost" className="px-3 py-1 text-xs" onClick={() => continueFrom(v)}>Continuar desde aquí</Button>
                  </div>
                </li>
              ))}
              <li className="py-2.5">
                <p className="flex flex-wrap items-center gap-2 font-medium">Original (intacto){source.kind === 'original' && <Badge tone="blue">Base actual</Badge>}</p>
                <p className="text-xs text-slate-500">{img.originalName} · {fileSize(img.size)} · {dateTime(img.createdAt)}</p>
                <p className="mt-0.5 break-all font-mono text-[11px] text-slate-500" title="Huella SHA-256 del archivo original">SHA-256 {img.originalSha256.slice(0, 32)}…</p>
                {source.kind !== 'original' && <Button variant="ghost" className="mt-1 px-3 py-1 text-xs" onClick={() => { setEdits([]); setPending(null); setSource({ kind: 'original' }); }}>Volver al original</Button>}
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}

export default function EditorPage() {
  return <SuperOnly><Editor /></SuperOnly>;
}

