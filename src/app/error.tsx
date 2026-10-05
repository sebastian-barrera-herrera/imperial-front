'use client';

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <h1 className="text-2xl font-semibold">Algo salió mal</h1>
      <p className="mt-2 text-slate-600">Ocurrió un error inesperado. Puedes intentarlo de nuevo.</p>
      <button onClick={reset} className="btn-primary mt-6">Reintentar</button>
    </div>
  );
}
