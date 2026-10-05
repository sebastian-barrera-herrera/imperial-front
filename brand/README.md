# Marca — Imperial Law Group

**Colores**

| Nombre | Hex | Uso |
|---|---|---|
| Azul Imperial | `#1d344a` | Logo sobre fondos claros, botones principales, sidebar y portadas oscuras |
| Crema | `#f9f8e1` | Logo sobre fondos oscuros, botón principal sobre azul, titulares sobre azul |

**Archivos originales** (`brand/source/`, tal como los entregó el cliente)

| Archivo | Descripción | Dónde se usa |
|---|---|---|
| `logo-azul-transparente.webp` | Azul sobre fondo transparente | Tema claro (cabeceras, pies, documentos claros) |
| `logo-blanco-transparente.webp` | Blanco sobre transparente | Base para generar la versión crema para tema oscuro |
| `logo-negro-transparente.webp` | Negro sobre transparente | Impresión monocromática / sellos / fax |
| `logo-crema-sobre-azul.webp` | Crema sobre azul sólido | Referencia de la versión oscura; no se usa tal cual en la web (el fondo no es transparente) |

**Versiones optimizadas** (`public/brand/`, las que sirve el sitio)

| Archivo | Descripción |
|---|---|
| `logo-navy.webp` / `logo-cream.webp` | Logo completo (con nombre y lema), transparente. El componente `<Logo variant="full">` elige la azul en tema claro y la crema en tema oscuro. |
| `mark-navy.webp` / `mark-cream.webp` | Solo el emblema (corona de laurel), para cabeceras, sidebar y espacios pequeños. |

`src/app/icon.png`, `apple-icon.png` y `opengraph-image.png` se generaron a partir del emblema/logo crema sobre el azul de marca.

**Para cambiar un logo:** reemplaza el archivo en `public/brand/` conservando el nombre y las proporciones (si cambian, ajusta `RATIO` en `src/components/Brand.tsx`). Los nombres, correos y datos legales se cambian con las variables `NEXT_PUBLIC_*` (ver `.env.example`).
