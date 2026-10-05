/** @type {import('next').NextConfig} */
const API_URL = process.env.API_URL ?? 'http://localhost:4000';

const nextConfig = {
  poweredByHeader: false,
  // El navegador solo habla con el origen de Next; así las cookies httpOnly son same-origin
  // y no hace falta exponer la API ni abrir CORS.
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${API_URL}/api/:path*` }];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
