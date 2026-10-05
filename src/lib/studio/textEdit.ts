// Edición de texto sobre una imagen, en el navegador (canvas). Para cada caja seleccionada: se borra el texto original
// reconstruyendo el fondo a partir de los píxeles que rodean la caja y se escribe el texto nuevo con el estilo elegido.
// Es determinista: la imagen final se obtiene siempre aplicando la lista de ediciones sobre la imagen base.

export type FontKey = 'sans' | 'serif' | 'mono' | 'display';
export type Align = 'left' | 'center' | 'right';
export type TextEdit = { x: number; y: number; w: number; h: number; text: string; font: FontKey; size: number; color: string; bold: boolean; italic: boolean; align: Align };
export type Box = { x: number; y: number; w: number; h: number };

export const FONT_LABELS: Record<FontKey, string> = {
  sans: 'Sans-serif (Helvetica / Arial)',
  serif: 'Serif (Georgia / Times)',
  mono: 'Monoespaciada (Courier)',
  display: 'Titular condensada (Impact)',
};
const FONT_STACKS: Record<FontKey, string> = {
  sans: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  serif: 'Georgia, "Times New Roman", Times, serif',
  mono: '"Courier New", Courier, monospace',
  display: 'Impact, "Arial Narrow", "Helvetica Neue", sans-serif',
};

type RGB = [number, number, number];
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const toHex = ([r, g, b]: RGB) => `#${[r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('')}`;
const mean = (colors: RGB[]): RGB | null => {
  if (!colors.length) return null;
  const sum = colors.reduce<RGB>((a, c) => [a[0] + c[0], a[1] + c[1], a[2] + c[2]], [0, 0, 0]);
  return [sum[0] / colors.length, sum[1] / colors.length, sum[2] / colors.length];
};

export function clampBox(b: Box, width: number, height: number): Box {
  const x = clamp(Math.round(b.x), 0, width - 1);
  const y = clamp(Math.round(b.y), 0, height - 1);
  return { x, y, w: clamp(Math.round(b.w), 1, width - x), h: clamp(Math.round(b.h), 1, height - y) };
}

/** Tamaño de letra inicial sugerido para una caja (una línea de texto). */
export const autoSize = (box: Box) => Math.max(8, Math.round(box.h * 0.78));

const BAND = 3; // grosor (px) de la franja de muestreo alrededor de la caja

/** Franjas de color alrededor de la caja: arriba, abajo, izquierda y derecha (null si la caja toca ese borde de la imagen). */
function surroundings(ctx: CanvasRenderingContext2D, b: Box) {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  const x0 = Math.max(0, b.x - BAND);
  const y0 = Math.max(0, b.y - BAND);
  const x1 = Math.min(W, b.x + b.w + BAND);
  const y1 = Math.min(H, b.y + b.h + BAND);
  const rw = x1 - x0;
  const data = ctx.getImageData(x0, y0, rw, y1 - y0).data;
  const at = (x: number, y: number): RGB => {
    const k = ((y - y0) * rw + (x - x0)) * 4;
    return [data[k], data[k + 1], data[k + 2]];
  };
  const range = (from: number, to: number) => Array.from({ length: Math.max(0, to - from) }, (_, i) => from + i);
  const col = (x: number, ys: number[]) => mean(ys.map((y) => at(x, y)));
  const row = (y: number, xs: number[]) => mean(xs.map((x) => at(x, y)));
  const cols = range(b.x, b.x + b.w);
  const rows = range(b.y, b.y + b.h);
  const topRows = range(y0, b.y);
  const botRows = range(b.y + b.h, y1);
  const leftCols = range(x0, b.x);
  const rightCols = range(b.x + b.w, x1);
  return {
    top: topRows.length ? cols.map((x) => col(x, topRows)!) : null,
    bottom: botRows.length ? cols.map((x) => col(x, botRows)!) : null,
    left: leftCols.length ? rows.map((y) => row(y, leftCols)!) : null,
    right: rightCols.length ? rows.map((y) => row(y, rightCols)!) : null,
  };
}

/**
 * Borra lo que haya dentro de la caja reconstruyendo el fondo: interpolación (parche de Coons) de los colores de los cuatro
 * bordes. Reproduce fondos lisos y degradados sin dejar rastro; en fondos con textura queda suavizado.
 */
export function eraseBox(ctx: CanvasRenderingContext2D, box: Box) {
  const b = clampBox(box, ctx.canvas.width, ctx.canvas.height);
  const s = surroundings(ctx, b);
  const all = [s.top, s.bottom, s.left, s.right].flat().filter((c): c is RGB => !!c);
  const flat: RGB = mean(all) ?? [255, 255, 255];
  const T = s.top ?? s.bottom ?? Array<RGB>(b.w).fill(flat);
  const B = s.bottom ?? s.top ?? Array<RGB>(b.w).fill(flat);
  const L = s.left ?? s.right ?? Array<RGB>(b.h).fill(flat);
  const R = s.right ?? s.left ?? Array<RGB>(b.h).fill(flat);
  const mid = (a: RGB, c: RGB): RGB => [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2, (a[2] + c[2]) / 2];
  const TL = mid(T[0], L[0]);
  const TR = mid(T[b.w - 1], R[0]);
  const BL = mid(B[0], L[b.h - 1]);
  const BR = mid(B[b.w - 1], R[b.h - 1]);
  const out = ctx.createImageData(b.w, b.h);
  for (let j = 0; j < b.h; j++) {
    const v = b.h > 1 ? j / (b.h - 1) : 0;
    for (let i = 0; i < b.w; i++) {
      const u = b.w > 1 ? i / (b.w - 1) : 0;
      const k = (j * b.w + i) * 4;
      for (let c = 0; c < 3; c++) {
        const value =
          (1 - v) * T[i][c] + v * B[i][c] + (1 - u) * L[j][c] + u * R[j][c] -
          ((1 - u) * (1 - v) * TL[c] + u * (1 - v) * TR[c] + (1 - u) * v * BL[c] + u * v * BR[c]);
        out.data[k + c] = clamp(Math.round(value), 0, 255);
      }
      out.data[k + 3] = 255;
    }
  }
  ctx.putImageData(out, b.x, b.y);
}

/** Color del texto existente en la caja: el de los píxeles que más se alejan del fondo (o negro/blanco si no hay contraste). */
export function detectInk(ctx: CanvasRenderingContext2D, box: Box): string {
  const b = clampBox(box, ctx.canvas.width, ctx.canvas.height);
  const s = surroundings(ctx, b);
  const bg = mean([s.top, s.bottom, s.left, s.right].flat().filter((c): c is RGB => !!c)) ?? [255, 255, 255];
  const data = ctx.getImageData(b.x, b.y, b.w, b.h).data;
  const far: { d: number; c: RGB }[] = [];
  for (let k = 0; k < data.length; k += 4) {
    const d = Math.hypot(data[k] - bg[0], data[k + 1] - bg[1], data[k + 2] - bg[2]);
    if (d > 60) far.push({ d, c: [data[k], data[k + 1], data[k + 2]] });
  }
  if (!far.length) return bg[0] * 0.299 + bg[1] * 0.587 + bg[2] * 0.114 > 140 ? '#111111' : '#ffffff';
  far.sort((p, q) => q.d - p.d);
  return toHex(mean(far.slice(0, Math.max(1, Math.round(far.length * 0.15))).map((f) => f.c))!);
}

/** Escribe el texto de la edición dentro de su caja; si no cabe, reduce el tamaño hasta que quepa. */
export function drawText(ctx: CanvasRenderingContext2D, e: TextEdit) {
  if (!e.text) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(e.x, e.y, e.w, e.h);
  ctx.clip();
  const setFont = (size: number) => (ctx.font = `${e.italic ? 'italic ' : ''}${e.bold ? 'bold ' : ''}${Math.max(1, size)}px ${FONT_STACKS[e.font]}`);
  let size = e.size;
  setFont(size);
  const width = ctx.measureText(e.text).width;
  if (width > e.w) {
    size = (size * e.w) / width;
    setFont(size);
  }
  ctx.fillStyle = e.color;
  ctx.textBaseline = 'middle';
  ctx.textAlign = e.align;
  const x = e.align === 'left' ? e.x : e.align === 'center' ? e.x + e.w / 2 : e.x + e.w;
  ctx.fillText(e.text, x, e.y + e.h / 2 + size * 0.04);
  ctx.restore();
}

/** Dibuja la imagen base y aplica, en orden, todas las ediciones. */
export function renderEdits(canvas: HTMLCanvasElement, base: CanvasImageSource & { width: number; height: number }, edits: TextEdit[]) {
  const width = 'naturalWidth' in base ? (base as HTMLImageElement).naturalWidth : base.width;
  const height = 'naturalHeight' in base ? (base as HTMLImageElement).naturalHeight : base.height;
  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Tu navegador no pudo preparar el lienzo');
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(base, 0, 0);
  for (const e of edits) {
    eraseBox(ctx, e);
    drawText(ctx, e);
  }
  return ctx;
}

export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo cargar la imagen'));
    img.src = url;
  });
}
