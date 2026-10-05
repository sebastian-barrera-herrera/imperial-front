# Imperial Law Group — Sitio y plataforma de clientes (`imperial-front`)

Aplicación web de Imperial Law Group: landing pública, área de clientes y panel interno (superadmin y abogados). Se conecta con la API del repositorio [`imperial-back`](https://github.com/sebastian-barrera-herrera/imperial-back).

**Stack:** Next.js 15 (App Router) · React 19 · Tailwind CSS 3 · TypeScript.

El navegador solo habla con Next: `/api/*` se reenvía a la API mediante `rewrites` (`next.config.mjs`), de modo que las cookies de sesión son *same-origin* y no hace falta exponer la API ni abrir CORS.

## Qué incluye

- **Sitio público:** landing (cómo funciona, inversión, equipo, testimonios), login, registro con consentimiento, **aviso de privacidad** y **política de privacidad**.
- **Área de clientes:** perfil, documentos (carga con progreso), solicitudes de desembolso, seguimiento de casos con línea de tiempo, alertas en tiempo real, capital e inversión con simulador, **Mi portafolio** y configuración.
- **Documento de aprobación (PDF):** el superadmin define sus datos (emisor, entidad financiera, fecha de solicitud, firmante, lugar, observaciones) y lo habilita; el cliente descarga desde el detalle de su desembolso aprobado una constancia profesional con logo, marca de agua, monto en cifras y letras y **código de verificación con QR**. La página pública `/verificar` confirma que el documento es auténtico y vigente (sin mostrar datos personales).
- **Documentos del despacho:** el superadmin entrega contratos, constancias, resoluciones, etc. a un cliente (ficha del cliente → «Documentos del despacho»); el cliente recibe una alerta y los ve en *Mis documentos → Recibidos del despacho*.
- **Editor de imágenes (superadmin):** sube una imagen, selecciona un texto, escribe el nuevo y descárgala. El fondo se reconstruye a partir de los píxeles de alrededor (fondos lisos y degradados quedan limpios); el tipo de letra se elige entre cuatro familias, así que el parecido con el original es aproximado. El original nunca se modifica y cada versión y descarga queda registrada. Pensado para piezas propias del despacho, no para documentos de terceros.
- **Asesor, depósitos y bajas:** cada cliente ve en su Inicio el nombre de su **asesor profesional** y su **valor depositado** (con historial en *Mis depósitos*), que registra el superadmin. El superadmin ve la **lista de clientes con sus datos** (país, asesor, depositado, estado) y puede **darlos de baja** —pierden el acceso al instante, se conservan sus datos— o reactivarlos.
- **Miami y toda Latinoamérica:** el despacho está en Miami; el sitio, el PDF y los textos legales lo reflejan (incluida la transferencia internacional de datos a EE. UU.) y el perfil pide el país del cliente.
- **Panel interno:** KPIs y gráficos, clientes, validación de documentos, desembolsos, casos, alertas, capital (oportunidades, valoraciones, inversiones y rescates), usuarios y roles, reportes CSV y auditoría.
- **Portafolio del inversionista:** valor actual, ganancia, rendimiento anualizado, gráfico interactivo (puntero, táctil y teclado, rangos 1M–Todo, tabla equivalente), distribución, posiciones con tendencia y ficha de rendimiento por oportunidad.
- **Animaciones sutiles:** entrada escalonada de la portada, aparición al hacer scroll (`src/components/Reveal.tsx`), líneas de los gráficos que se dibujan, tarjetas que se elevan al pasar el cursor, cabecera que gana sombra y transición entre páginas del panel. Solo CSS más un `IntersectionObserver`; sin dependencias. Se desactivan con «reducir movimiento» del sistema y, sin JavaScript, todo el contenido se ve igual. Los estilos están al final de `src/app/globals.css`.
- **Tema claro por defecto**, con opción de oscuro o «del sistema» (se recuerda la elección), sin parpadeo, y diseño responsive de 320 px a escritorio (las tablas se apilan como tarjetas en móvil).
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
| `NEXT_PUBLIC_LEGAL_ADDRESS` | Dirección física del despacho (por defecto «Miami, Florida, Estados Unidos de América»; agrega la calle completa si quieres mostrarla en el aviso y la política). |
| `NEXT_PUBLIC_CONTACT_EMAIL` / `NEXT_PUBLIC_PRIVACY_EMAIL` | Correos de contacto y de privacidad. |
| `NEXT_PUBLIC_SITE_URL` | URL pública (imagen al compartir en redes). |

## Marca

Colores: **azul `#1d344a`** y **crema `#f9f8e1`** (tomados del logo). La paleta del sitio (`src/app/globals.css` y `tailwind.config.ts`) deriva de ese azul; en tema oscuro las mismas clases cambian de valor mediante variables CSS. Los logos originales están en `brand/source/` y las versiones optimizadas en `public/brand/`; el componente `src/components/Brand.tsx` elige la versión según el tema. Detalle en [`brand/README.md`](brand/README.md).

## Contenido que debes revisar y reemplazar

- **Aviso y política de privacidad** (`src/app/aviso-de-privacidad`, `src/app/privacidad`): están redactados según lo que la plataforma hace (cifrado, cookies, auditoría) pero son un texto general. **Debe revisarlos tu asesor jurídico** (normativa aplicable, plazos de conservación, autoridad de control) antes de operar. Si cambian de forma sustancial, sube `privacyVersion` en `src/lib/site.ts` **y** `PRIVACY_VERSION` en la API.
- **Equipo y testimonios:** se editan desde el panel, en **Contenido del sitio** (solo superadmin): textos, nombres, fotos, orden y publicar/ocultar, con cambios visibles al instante en la landing. Las personas deben ser **reales y haber autorizado por escrito** publicar su nombre, opinión y foto: al crear algo, cambiar un texto, un nombre o una foto, o reemplazar un ejemplo, el panel exige confirmarlo y la API deja constancia de quién y cuándo. Mientras haya contenido de ejemplo publicado, la web lo rotula como «ilustrativo»; si la API aún no tiene contenido, se muestra el de respaldo de `src/content/`.
- **Fotos:** se suben desde el panel; se recortan en cuadrado, se reducen a 512 px y se re-codifican (sin datos EXIF). Usa solo fotos del equipo real o con licencia y autorización de imagen que permita ese uso.

## Estructura

```
src/app/            rutas (landing, auth, dashboard, admin, verificación pública, páginas legales)
src/lib/studio/     motor del editor de imágenes (canvas)
src/components/     UI compartida (ui, charts, LineChart, Brand, Shell, …)
src/content/        contenido de respaldo (equipo y testimonios) si la API aún no tiene el propio
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
