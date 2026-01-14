# Optimizaciones Técnicas - Resumen de Implementación

Fecha: 13 de enero de 2026

## 1. ✅ Seguridad en Formulario de Contacto

### Implementado:

#### Honeypot (Anti-bot):
- Campo oculto `website` invisible para usuarios legítimos
- Los bots que rellenan todos los campos son silenciosamente rechazados
- No revela que fue detectado un bot (mejor práctica de seguridad)
- **Archivo**: [src/components/ContactForm.astro](src/components/ContactForm.astro)

#### Rate Limiting Cliente:
- Espera de 5 segundos entre envíos (localStorage)
- Aviso al usuario si intenta enviar demasiado rápido
- Previene accidentes y spam accidental

#### Rate Limiting Servidor (IP-based):
- Máximo 5 emails por IP cada 1 hora
- Almacenamiento en memoria (en producción con cPanel, considera Redis)
- Devuelve HTTP 429 si se excede el límite
- **Archivo**: [src/pages/api/contact.ts](src/pages/api/contact.ts)

#### Validaciones Mejoradas:
- ✅ Validación de formato de email con regex
- ✅ Límite máximo de 5000 caracteres en mensaje
- ✅ Sanitización HTML en servidor (escapeHtml)
- ✅ Validación de consentimiento doble (cliente + servidor)

---

## 2. ✅ Página 404 Personalizada

### Implementado:
- Página creativa y branded [src/pages/404.astro](src/pages/404.astro)
- Diseño coherente con la identidad artística
- Enlaces útiles de navegación (inicio, galería, blog, contacto)
- Metáfora artística: "Esta obra no ha sido encontrada"
- Reduce tasa de rebote y mejora UX en enlaces rotos

---

## 3. 🔍 Optimización de Imágenes Remotas de WordPress

### Estado Actual:
Tienes un proxy de imágenes funcional en [src/pages/api/img-proxy.ts](src/pages/api/img-proxy.ts) con:
- ✅ Control de caché HTTP (Cache-Control inteligente)
- ✅ Validación de protocolo (http/https)
- ✅ Lista blanca opcional de hosts
- ✅ Firma HMAC para seguridad (IMAGE_PROXY_SECRET)
- ✅ Límite de 10MB por imagen
- ✅ Validación de Content-Type

### Recomendaciones:

#### A) Si WordPress está en el mismo dominio o subdominio confiable:
```env
PUBLIC_IMAGE_PROXY=on
PUBLIC_IMAGE_PROXY_ALLOW=artenlaclase.cl,cdn.artenlaclase.cl
```

#### B) Para máxima seguridad, usa HMAC:
```env
IMAGE_PROXY_SECRET=tu_secreto_generado_aleatoriamente_muy_largo
```
Luego, genera firmas en cliente:
```javascript
const secret = 'tu_secreto...';
const imageUrl = 'https://artenlaclase.cl/wp-content/uploads/2024/01/image.jpg';
const sig = await fetch('/api/generate-sig', {
  method: 'POST',
  body: JSON.stringify({ url: imageUrl, secret })
}).then(r => r.json());
// Usar en proxy: `/api/img-proxy?url=${encodeURIComponent(imageUrl)}&sig=${sig.sig}`
```

#### C) Considera usar **Sharp** o **imagemin** para procesamiento local:
Aunque usas Astro que tiene optimización automática de `<Image />`, si las imágenes de WP son muy pesadas:

```bash
npm install sharp
```

Luego en un endpoint:
```typescript
import sharp from 'sharp';

export const GET: APIRoute = async ({ request }) => {
  const { url, width, format } = new URL(request.url).searchParams;
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  
  let processed = sharp(buffer);
  if (width) processed = processed.resize(parseInt(width), undefined, { withoutEnlargement: true });
  if (format === 'webp') processed = processed.webp({ quality: 80 });
  
  return new Response(await processed.toBuffer(), {
    headers: { 'Content-Type': `image/${format || 'jpeg'}` }
  });
};
```

#### D) Headers de caché agresivo en .htaccess (cPanel):
```apache
# En /public/.htaccess o raíz
<FilesMatch "\.(jpg|jpeg|png|gif|webp|svg|avif)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
</FilesMatch>

<FilesMatch "\.js$">
    Header set Cache-Control "public, max-age=31536000"
</FilesMatch>

<FilesMatch "\.css$">
    Header set Cache-Control "public, max-age=31536000"
</FilesMatch>
```

---

## 4. 📊 SSR vs SSG: Análisis y Recomendación

### Estado Actual:
```javascript
// astro.config.mjs
output: 'server'
adapter: node({ mode: 'standalone' })
```

### Análisis SSR (Server-Side Rendering):

**Ventajas:**
- ✅ Contenido dinámico sin rebuild (si usas webhooks de WP)
- ✅ Escalabilidad por demanda
- ✅ Información en tiempo real

**Desventajas:**
- ❌ TTFB (Time to First Byte) más alto: **300-800ms** típico
- ❌ Consumo de CPU/memoria en servidor
- ❌ Mayor uso de banda de salida desde cPanel
- ❌ Necesitas Node.js siempre corriendo

### Análisis SSG (Static Site Generation):

**Ventajas:**
- ✅ TTFB ultra rápido: **50-150ms** (HTML puro)
- ✅ CDN-friendly (Apache sirve archivos estáticos)
- ✅ Menor consumo de CPU/RAM
- ✅ Sin dependencias de Node.js en runtime
- ✅ Mejor SEO (páginas servidas más rápido)

**Desventajas:**
- ❌ Requiere rebuild en cada actualización de WP
- ❌ Build puede tardar 2-5 minutos en sitios grandes

### ⚡ Recomendación para tu caso:

**Cambiar a SSG + Webhooks** es probablemente óptimo si:
- El blog no se actualiza más de 5-10 veces/día
- Puedes configurar webhook en WordPress (gratuito)
- Prefieres mejor rendimiento y menor costo de servidor

#### Pasos para migrar a SSG:

1. **Actualizar astro.config.mjs:**
```javascript
export default defineConfig({
  output: 'static', // Cambiar de 'server' a 'static'
  // Quitar adapter: node({ mode: 'standalone' })
  // El resto se mantiene igual
});
```

2. **Rutas dinámicas deben tener prerender:**
```typescript
// En src/pages/blog/[slug].astro
export const prerender = true;

// O desactiva prerender selectivamente:
export const prerender = false; // Para rutas que requieren datos en tiempo real
```

3. **Webhook en WordPress:**
   - Plugin recomendado: **WebHooks Slim** o **Deploy Hooks**
   - En cPanel: Crear script deploy.php que ejecute `npm run build && npm run deploy`
   - En WordPress: Configurar webhook POST a `https://tudominio.cl/api/deploy`

4. **Headers de caché inmediato:**
```apache
# .htaccess
<FilesMatch "\.html$">
    Header set Cache-Control "public, max-age=3600"
</FilesMatch>
```

---

## 5. 🔒 Seguridad en Variables de Entorno

### Verificado:
- ✅ GMAIL_USER, GMAIL_APP_PASSWORD no están en código
- ✅ IMAGE_PROXY_SECRET protegido (server-only)
- ✅ Variables sensibles accedidas vía `process.env` (servidor)

### Próximos pasos:
- Crear `.env.example` (sin valores reales)
- Documentar en README que variables son requeridas
- Usar secrets en cPanel > Setup Node.js App

---

## 6. 📈 Próximas Optimizaciones (Opcional)

### A) Compresión GZIP en cPanel:
```apache
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript
</IfModule>
```

### B) Preload Critical Resources:
```html
<link rel="preload" as="font" href="/fonts/sistema.woff2" type="font/woff2" crossorigin>
<link rel="preconnect" href="https://artenlaclase.cl" crossorigin>
```

### C) Service Worker para offline:
```typescript
// src/service-worker.ts
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('v1').then(cache => {
      return cache.addAll([
        '/',
        '/galeria',
        '/blog',
        '/offline.html'
      ]);
    })
  );
});
```

### D) Monitoreo de Performance:
- Web Vitals: Integra Google Analytics 4
- Sentry para errores: `npm install @sentry/astro`
- Lighthouse CI en GitHub Actions

---

## 📋 Checklist de Implementación

- [x] Página 404 creada
- [x] Honeypot en formulario
- [x] Rate limiting cliente y servidor
- [x] Validaciones mejoradas en contact API
- [ ] Configurar proxy de imágenes en .env (si usas WP)
- [ ] Migrar a SSG (si decides no usar contenido dinámico)
- [ ] Configurar webhook de deploy (si migras a SSG)
- [ ] Agregar headers de caché en .htaccess
- [ ] Documentar variables de entorno en README

---

## 🚀 Próximos Pasos Inmediatos

1. **Build y prueba:**
```bash
npm run build
npm run preview
```

2. **Prueba el formulario:**
   - Intenta enviar un mensaje válido ✅
   - Verifica rate limiting (5 segundos entre envíos)
   - Comprueba honeypot (abre DevTools, rellena el campo `website`)

3. **Revisa el 404:**
   - Visita una ruta que no existe: `/articuloquenoexiste`
   - Debe mostrar la página personalizada

4. **Si usas WordPress:**
   - Activa el proxy: `PUBLIC_IMAGE_PROXY=on`
   - Prueba una imagen remota desde WP

---

**Última actualización**: 13 de enero 2026
