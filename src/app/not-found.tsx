import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="font-serif text-6xl font-semibold text-gold-500">404</p>
      <h1 className="mt-3 text-2xl font-semibold">No encontramos esta página</h1>
      <p className="mt-2 text-slate-600">Es posible que el enlace haya cambiado o que ya no exista.</p>
      <Link href="/" className="btn-primary mt-6">Volver al inicio</Link>
    </div>
  );
}
