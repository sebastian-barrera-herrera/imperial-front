export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const AUTH_PATHS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];
let refreshing: Promise<boolean> | null = null;

/** Renueva la sesión una sola vez aunque varias peticiones fallen con 401 a la vez. */
function refreshSession(): Promise<boolean> {
  refreshing ??= fetch('/api/auth/refresh', { method: 'POST' })
    .then((r) => r.ok)
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

function messageFrom(body: unknown, fallback: string): string {
  const message = (body as { message?: string | string[] } | null)?.message;
  if (Array.isArray(message)) return message.join('. ');
  return message || fallback;
}

async function send(path: string, init: RequestInit): Promise<Response> {
  let res = await fetch(`/api${path}`, { credentials: 'same-origin', ...init });
  if (res.status === 401 && !AUTH_PATHS.includes(path)) {
    if (await refreshSession()) res = await fetch(`/api${path}`, { credentials: 'same-origin', ...init });
    // /auth/me es la comprobación de sesión inicial: que no haya sesión es normal en páginas públicas,
    // así que no debe disparar la salida forzada (AuthProvider ya lo maneja).
    if (res.status === 401 && path !== '/auth/me' && typeof window !== 'undefined') window.dispatchEvent(new Event('ilg:unauthorized'));
  }
  return res;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await send(path, init);
  } catch {
    throw new ApiError(0, 'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.');
  }
  const text = await res.text();
  const body = text ? safeJson(text) : null;
  if (!res.ok) throw new ApiError(res.status, messageFrom(body, `Error ${res.status}`));
  return body as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

const json = (method: string, body?: unknown): RequestInit => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: body === undefined ? undefined : JSON.stringify(body),
});

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, json('POST', body)),
  put: <T>(path: string, body?: unknown) => request<T>(path, json('PUT', body)),
  patch: <T>(path: string, body?: unknown) => request<T>(path, json('PATCH', body)),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

/** Subida con progreso (fetch aún no expone el progreso de subida). */
export function uploadFile<T>(path: string, form: FormData, onProgress?: (percent: number) => void): Promise<T> {
  const attempt = (): Promise<{ status: number; text: string }> =>
    new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `/api${path}`);
      xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100));
      xhr.onload = () => resolve({ status: xhr.status, text: xhr.responseText });
      xhr.onerror = () => reject(new ApiError(0, 'No pudimos conectar con el servidor.'));
      xhr.send(form);
    });

  return (async () => {
    let res = await attempt();
    if (res.status === 401 && (await refreshSession())) res = await attempt();
    const body = res.text ? safeJson(res.text) : null;
    if (res.status < 200 || res.status >= 300) throw new ApiError(res.status, messageFrom(body, `Error ${res.status}`));
    return body as T;
  })();
}

/**
 * Descarga un archivo protegido: usa la misma renovación de sesión que el resto de peticiones (un enlace directo fallaría con
 * la sesión caducada) y respeta el nombre que sugiere la API.
 */
export async function downloadFile(path: string, fallbackName = 'documento'): Promise<void> {
  let res: Response;
  try {
    res = await send(path, {});
  } catch {
    throw new ApiError(0, 'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.');
  }
  if (!res.ok) {
    const text = await res.text();
    throw new ApiError(res.status, messageFrom(text ? safeJson(text) : null, `Error ${res.status}`));
  }
  const disposition = res.headers.get('content-disposition') ?? '';
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(disposition)?.[1];
  const plain = /filename="([^"]+)"/i.exec(disposition)?.[1];
  const name = encoded ? decodeURIComponent(encoded) : plain ?? fallbackName;
  const url = URL.createObjectURL(await res.blob());
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
