# Imperial Law Group — Sitio y plataforma de clientes (`imperial-front`)

Aplicación web de Imperial Law Group: landing pública, área de clientes y panel interno (superadmin y abogados). Se conecta con la API del repositorio [`imperial-back`](https://github.com/sebastian-barrera-herrera/imperial-back).

**Stack:** Next.js 15 (App Router) · React 19 · Tailwind CSS 3 · TypeScript.

El navegador solo habla con Next: `/api/*` se reenvía a la API mediante `rewrites` (`next.config.mjs`), de modo que las cookies de sesión son *same-origin* y no hace falta exponer la API ni abrir CORS.

## Qué incluye

- **Sitio público:** landing (cómo funciona, inversión, equipo, testimonios), login, registro con consentimiento, **aviso de privacidad** y **política de privacidad**.
- **Área de clientes:** perfil, documentos (carga con progreso), solicitudes de desembolso, seguimiento de casos con línea de tiempo, alertas en tiempo real, capital e inversión con simulador, **Mi portafolio** y configuración.
- **Panel interno:** KPIs y gráficos, clientes, validación de documentos, desembolsos, casos, alertas, capital (oportunidades, valoraciones, inversiones y rescates), usuarios y roles, reportes CSV y auditoría.
- **Portafolio del inversionista:** valor actual, ganancia, rendimiento anualizado, gráfico interactivo (puntero, táctil y teclado, rangos 1M–Todo, tabla equivalente), distribución, posiciones con tendencia y ficha de rendimiento por oportunidad.
- **Tema claro / oscuro / del sistema** sin parpadeo, y diseño responsive de 320 px a escritorio (las tablas se apilan como tarjetas en móvil).
- **Accesibilidad:** verificada con axe (WCAG A/AA) en ambos temas; navegación por teclado, `aria-live` en avisos y gráficos con tabla equivalente.

## Inicio rápido

Requisitos: Node 20+ y la API (`imperial-back`) corriendo en `http://localhost:4000`.

```bash
npm install
cp .env.example .env.local     # opcional: solo para cambiar API_URL o la marca
npm run dev                    # http://localhost:3000
```

Para producción: `npm run build && npm start`.

## Variables de entorno

Se leen al **compilar** (`next build`/`next dev`).

| Variable | Descripción |
|---|---|
| `API_URL` | URL interna de la API (por defecto `http://localhost:4000`). |
| `NEXT_PUBLIC_SITE_NAME` | Nombre mostrado (por defecto *Imperial Law Group*). |
| `NEXT_PUBLIC_LEGAL_ENTITY` | Razón social completa para los textos legales. |
| `NEXT_PUBLIC_LEGAL_ADDRESS` | Dirección física (si se define, aparece en el aviso y la política). |
| `NEXT_PUBLIC_CONTACT_EMAIL` / `NEXT_PUBLIC_PRIVACY_EMAIL` | Correos de contacto y de privacidad. |
| `NEXT_PUBLIC_SITE_URL` | URL pública (imagen al compartir en redes). |
| `NEXT_PUBLIC_SAMPLE_CONTENT` | `false` para ocultar la etiqueta «contenido ilustrativo» cuando el equipo y los testimonios sean reales. |

## Marca

Colores: **azul `#1d344a`** y **crema `#f9f8e1`** (tomados del logo). La paleta del sitio (`src/app/globals.css` y `tailwind.config.ts`) deriva de ese azul; en tema oscuro las mismas clases cambian de valor mediante variables CSS. Los logos originales están en `brand/source/` y las versiones optimizadas en `public/brand/`; el componente `src/components/Brand.tsx` elige la versión según el tema. Detalle en [`brand/README.md`](brand/README.md).

## Contenido que debes revisar y reemplazar

- **Aviso y política de privacidad** (`src/app/aviso-de-privacidad`, `src/app/privacidad`): están redactados según lo que la plataforma hace (cifrado, cookies, auditoría) pero son un texto general. **Debe revisarlos tu asesor jurídico** (normativa aplicable, plazos de conservación, autoridad de control) antes de operar. Si cambian de forma sustancial, sube `privacyVersion` en `src/lib/site.ts` **y** `PRIVACY_VERSION` en la API.
- **Equipo y testimonios** (`src/content/team.ts`, `src/content/testimonials.ts`): son **ejemplos ilustrativos**. Sustitúyelos por personas y opiniones reales (con autorización escrita) y luego pon `NEXT_PUBLIC_SAMPLE_CONTENT=false`. Los testimonios usan iniciales y no fotos de archivo a propósito: una foto de una persona real junto a una cita implica que esa persona avala al despacho.
- **Fotos del equipo:** copia el archivo a `public/images/team/` y pon la ruta en `photo`. Usa solo fotos del equipo real (o con licencia y autorización de imagen que permita ese uso).

## Estructura

```
src/app/            rutas (landing, auth, dashboard, admin, páginas legales)
src/components/     UI compartida (ui, charts, LineChart, Brand, Shell, …)
src/content/        equipo y testimonios (reemplazables)
src/lib/            api (con renovación de sesión), auth, formato, tipos, hooks
public/brand/       logos optimizados
brand/              logos originales y notas de marca
```

## Calidad

`npm run typecheck` y `npm run build`. La verificación de la interfaz se hizo en navegador real (flujo completo cliente ↔ superadmin con alertas en vivo) y con una matriz de páginas × anchos (360/768/1280) × temas sin desbordes ni violaciones de axe.

## Despliegue

- Sirve todo por **HTTPS**; en producción las cookies de sesión son `Secure`.
- Define `API_URL` **antes** de compilar y no publiques la API: solo Next debe alcanzarla.
- Las variables `NEXT_PUBLIC_*` se incrustan en la compilación.
