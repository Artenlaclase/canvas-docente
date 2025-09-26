## Canvas Docente

Sitio web para documentar 20 años de proyectos de artes visuales: técnicas (Pintura, Collage, Audiovisual, Mosaico, Volumen, Máscaras, Lámparas, Diseño, Dibujo) y un blog de experiencias.

### Tecnologías
- Astro 5
- Tailwind CSS (+ Typography)
- Colecciones de contenido de Astro (Markdown/MDX)

### Estructura principal

```
src/
  components/
    Header.astro
    Gallery.astro
    
    BlogCard.astro
  layouts/
    BaseLayout.astro
  pages/
    index.astro
    galeria/
      index.astro
      tecnica/[technique].astro
      anio/[year].astro
    blog/
      index.astro
      [slug].astro
    sobre-mi.astro
    api/
      contact.ts
  content/
    config.ts
    galeria/
      ...md|mdx (obras)
    blog/
      ...md|mdx (posts)
  styles/
    global.css
```

### Contenido
Colecciones definidas en `src/content/config.ts`:
- `galeria`: { title, technique, year, cover?, images[], tags[] }
- `blog`: { title, excerpt?, date, cover?, tags[] }

Ejemplos: `src/content/galeria/pintura-ejemplo.md`, `src/content/blog/primer-post.md`.

### Ejecutar en desarrollo

1) Instalar dependencias
```powershell
npm install
```

2) Iniciar el servidor
```powershell
npm run dev
```

3) Sincronizar tipos de contenido (si agregas/eliminas archivos MD/MDX)
```powershell
npx astro sync
```

### Construir
```powershell
npm run build

### Formulario de contacto (correo)

El sitio incluye un formulario en la portada que envía correos vía Gmail (SMTP) usando un endpoint de Astro (`/api/contact`). Para habilitarlo:

1) Crea un archivo `.env` en la raíz basado en `.env.example` y define:

```
GMAIL_USER=tu_cuenta@gmail.com
GMAIL_APP_PASSWORD=tu_app_password
CONTACT_TO=devweb.venta@gmail.com # opcional (si no se define, se usa GMAIL_USER)
```

2) Usa una contraseña de aplicación (App Password) de Gmail con 2FA activado, no tu contraseña normal.

3) Reinicia el servidor de desarrollo.

Notas:
- El botón “Contacto” del menú te lleva a la sección `/#contacto` de la página de inicio.
- Si despliegas en entornos que no permiten funciones/SSR, necesitarás un servicio externo de email o un adaptador compatible para Astro.
```

### Añadir nuevas obras (galería)
Crear un archivo `.md` o `.mdx` en `src/content/galeria/` con frontmatter:

```
---
title: "Nombre de la obra o serie"
technique: "Pintura" # o Collage, Audiovisual, Mosaico, Volumen, Máscaras, Lámparas, Diseño, Dibujo
year: 2021
cover: "/ruta/a/imagen.jpg" # opcional
images: []
tags: ["aula", "materiales"]
---
Descripción opcional...
```

### Añadir posts del blog
Crear un `.md` en `src/content/blog/`:

```
---
title: "Título del post"
excerpt: "Resumen corto"
date: 2024-06-10
cover: "/ruta/a/imagen.jpg"
tags: ["reflexión"]
---
Cuerpo del post...
```

#### Portadas (cover) del blog

Puedes definir la portada (`cover`) de tres formas:

1) Imagen local en `src/assets/images` (recomendado)

```md
---
title: "Mi post"
date: 2025-01-01
cover: "../../assets/images/mi-portada.webp"
---
```

2) Imagen en `public/` (ruta absoluta desde la raíz)

```md
---
title: "Mi post"
date: 2025-01-01
cover: "/images/mi-portada.webp" # si está en public/images/mi-portada.webp
---
```

3) URL externa

```md
---
title: "Mi post"
date: 2025-01-01
cover: "https://example.com/mi-portada.jpg"
---
```

El proyecto intenta resolver automáticamente imágenes locales bajo `src/assets` para optimizarlas y que funcionen tanto en `dev/preview` como en `build`. Si la ruta no se puede resolver como asset, se usa `<img>` como fallback.

### Notas
- Los estilos de Tailwind están en `src/styles/global.css` y se importan en `BaseLayout.astro`.
- Si ves advertencias en el editor sobre `@tailwind` o `@apply`, son del analizador estático del editor. En la compilación real de Astro se procesan con PostCSS/Tailwind.

### Blog con WordPress (opcional)

Puedes usar tu sitio WordPress como backend para el blog usando la API REST.

Configuración:

1. Define una variable de entorno con la URL base de tu WP:
   - `WP_API_BASE` (recomendado) o `PUBLIC_WP_API_BASE`
   - Acepta:
     - `https://tu-sitio.com` (se completará a `/wp-json/wp/v2`)
     - o directamente `https://tu-sitio.com/wp-json/wp/v2`
  - o instalaciones en subcarpeta usando `rest_route` (por ej. `https://tu-sitio.com/blog/?rest_route=/wp/v2`)
2. Publica entradas con estado "publicado". Se usará la imagen destacada si está disponible.

Comportamiento:

- Si la variable está definida, las rutas `/blog` y `/blog/[slug]` buscarán primero en WordPress. Si hay un fallo o no hay entradas, se hace fallback a la colección local (`src/content/blog`).
- El contenido de WP se renderiza como HTML (`content.rendered` de la API). Asegúrate de confiar en tu origen WP o filtrar en WP.

Limitaciones iniciales:

- Paginación: `/blog` muestra 9 posts por página y usa `/blog/page/[n]` para las siguientes páginas. Con WP se usa el conteo de `X-WP-TotalPages`.
- Taxonomías/categorías: no se exponen aún en la UI.

Ejemplo `.env`:

```
# Sitio WP en subcarpeta
WP_API_BASE=https://artenlaclase.cl/blog/?rest_route=/wp/v2
```

### Despliegue en cPanel (Node.js App)

Este proyecto está configurado con SSR (output: 'server') y adaptador Node. No genera `index.html` estáticos; en su lugar genera un servidor Node dentro de `dist/`.

Pasos:

1) Construye el proyecto:

```powershell
npm ci
npm run build
```

2) Sube a cPanel (Administrador de archivos o FTP/SFTP) estos elementos a la carpeta de tu app (por ejemplo `~/app`):
- La carpeta `dist/` completa
- El archivo `server.js` (archivo de arranque que importa `dist/server/entry.mjs`)
- `package.json` y `package-lock.json` (opcional pero recomendado si instalarás en el servidor)
- `.env` con tus variables (si aplica)

3) En cPanel > Setup Node.js App:
- App Root: la carpeta donde subiste (p. ej. `/home/usuario/app`)
- Application startup file: `server.js`
- Node.js version: 18 o superior
- Variables de entorno: define `PORT` si cPanel te da uno específico; y tus `WP_API_BASE`, etc.
- Ejecuta “Run NPM Install” si necesitas instalar dependencias (normalmente no hace falta si solo sirves `dist/`).

4) Inicia/Restart la app. Accede por tu dominio (cPanel hace proxy al puerto `PORT`).

Notas:
- Si tu hosting no soporta Node.js Apps, necesitarías un server con Node, o convertir a `output: 'static'` (perderías SSR/búsqueda en vivo).
- Para puerto distinto en local: `set PORT=4322 && npm run start` (Windows PowerShell: `$env:PORT=4322; npm run start`).

### Diagnóstico de rutas del Blog en producción

Si `/blog/<slug>` devuelve 404 en tu hosting (cPanel/Passenger) sigue estos pasos tras desplegar la última build:

1. Abre `/api/diag-routes` – Debe listar las rutas esperadas del blog y las variables de entorno clave.
2. Abre `/api/env-debug` – Verifica que `PUBLIC_WP_MEDIA_ROOT` NO sea `/blog` (si aparece así, elimínala del entorno y reinicia). También revisa `WP_API_BASE`.
3. Abre `/api/wp-list` – Debe devolver un JSON con posts (primer página desde WordPress). Si falla, hay problema de conexión a WP.
4. Abre `/api/blog-links` – Haz clic en un enlace de slug y observa si 404.
5. Prueba acceso directo por ID: `/blog/id/123` (reemplaza 123 por un ID real de WP). Si esto funciona pero `/blog/mi-post` no, el problema es de reescrituras Apache.
6. Prueba el fallback: `/blog/mi-post/` (con barra final) y `/blog/mi-post?x=1` para ver si alguna variante pasa al servidor Node.
7. Activa logs temporales: define `DEBUG_BLOG=1` en entorno y reinicia; revisa logs de Passenger para ver si se registra la petición.

#### .htaccess mínimo (todas las rutas a Node)

Si no tienes PHP conviviendo, puedes forzar todo a Node:

```apache
PassengerEnabled on
PassengerAppType node
PassengerStartupFile app.cjs
PassengerAppRoot /home/<USER>/canvas-docente
PassengerNodejs /usr/bin/node

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  # Deja pasar archivos/directorios reales (imágenes, CSS, etc.)
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]
  # Todo lo demás a la app Node
  RewriteRule ^.*$ /app.cjs [L]
</IfModule>
```

#### .htaccess solo para /blog (convive con sitio principal PHP)

```apache
PassengerEnabled on
PassengerAppType node
PassengerStartupFile app.cjs
PassengerAppRoot /home/<USER>/canvas-docente
PassengerNodejs /usr/bin/node

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]
  RewriteRule ^blog/.*$ /app.cjs [L]
</IfModule>
```

Si aún 404:
- Asegúrate de que `app.cjs` esté en la raíz de App Root.
- Reinicia la aplicación en cPanel tras cambiar `.htaccess`.
- Verifica que no exista un archivo físico `blog` o `blog/index.html` que intercepte.

#### Imágenes de WordPress rotas

Generalmente se debe a `PUBLIC_WP_MEDIA_ROOT` erróneo. Solución:

1. Elimina esa variable si apunta a `/blog`.
2. Deja que el código detecte automáticamente `https://artenlaclase.cl/wp-content/uploads`.
3. Limpia caché del navegador / CDN.
4. Revisa el HTML renderizado (Inspeccionar) y confirma que las rutas de imágenes comienzan por `https://artenlaclase.cl/wp-content/uploads/...`.

#### Recolección de evidencia
Comparte en soporte la salida de:
- `/api/diag-routes`
- `/api/env-debug`
- Una URL 404 de slug y la misma usando `/blog/id/<id>` (que funcione)
- Una URL directa de imagen rota

Con esos datos se puede ajustar definitivamente la regla de reescritura.
