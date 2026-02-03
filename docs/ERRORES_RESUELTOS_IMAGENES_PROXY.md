# Errores Resueltos - Imágenes del Blog WordPress

**Fecha:** 2-3 de febrero de 2026  
**Problema Principal:** Imágenes del blog de WordPress no cargan en la página principal de producción (artenlaclase.cl)

---

## Contexto Inicial

- **Síntoma:** Homepage no muestra imágenes de las tarjetas de blog
- **Origen del problema:** Comenzó después de implementar actualizaciones SEO
- **Entorno afectado:** Producción (cPanel con Node.js)
- **Entorno local:** Funcionaba correctamente

---

## Error #1: Espacio en blanco en WP_API_BASE

### Descripción
La variable de entorno `WP_API_BASE` tenía un espacio en blanco al inicio: `" https://api.artenlaclase.cl/wp-json/wp/v2"`

### Impacto
- Las URLs de WordPress se formaban incorrectamente
- Fallos en las peticiones HTTP al API de WordPress

### Solución
**Archivo:** `src/utils/wp.ts`

```typescript
// Línea 72 - getWpBase()
if (b && typeof b === 'string') b = b.trim();

// Línea 119 - getConfiguredMediaRoot()
if (override && typeof override === 'string') override = override.trim();
```

**Acción del usuario:** Eliminar espacio en blanco de la variable en cPanel

---

## Error #2: Index.astro prerenderizado (no SSR)

### Descripción
La página principal (`index.astro`) se prerenderizaba durante el build, no tenía acceso a variables de entorno de producción en runtime.

### Impacto
- No podía leer `WP_API_BASE` de producción
- Usaba valores de build-time en lugar de runtime
- Homepage no obtenía posts de WordPress

### Solución
**Archivo:** `src/pages/index.astro`

```typescript
// Línea 2 - Forzar Server-Side Rendering
export const prerender = false;
```

**Resultado:** Página se renderiza en cada request con acceso a env vars de producción

---

## Error #3: Proxy de imágenes devuelve 403 Forbidden

### Descripción
El endpoint `/api/img-proxy` rechazaba todas las peticiones con error 403 y mensaje "Proxy disabled"

### Causa Raíz
La variable `PUBLIC_IMAGE_PROXY` tenía valores diferentes:
- **Build-time** (`import.meta.env`): "off" 
- **Runtime** (`process.env`): "on"

El código solo leía `import.meta.env`, que contenía "off" del entorno de desarrollo local.

### Impacto
- Todas las imágenes proxied devolvían 403
- Homepage mostraba placeholders vacíos en lugar de imágenes

### Solución Intentada #1 (Fallida)
Agregar `.trim()` a la lectura de `PUBLIC_IMAGE_PROXY`:

```typescript
// img-proxy.ts - línea 48
const proxyEnabled = ((envAny.PUBLIC_IMAGE_PROXY || envAny.IMAGE_PROXY || '').toString().trim().toLowerCase());
```

**Resultado:** No funcionó porque el problema era el valor "off", no espacios en blanco.

### Solución Final (Exitosa)
Leer de ambas fuentes (`import.meta.env` y `process.env`), priorizando `process.env`:

**Archivo:** `src/pages/api/img-proxy.ts` (líneas 48-57)

```typescript
// Check both import.meta.env (Astro) and process.env (Node.js runtime)
const envAny: any = import.meta.env as any;
const proxyFromAstro = (envAny.PUBLIC_IMAGE_PROXY || envAny.IMAGE_PROXY || '').toString().trim().toLowerCase();
const proxyFromNode = (typeof process !== 'undefined' && process.env) 
  ? (process.env.PUBLIC_IMAGE_PROXY || process.env.IMAGE_PROXY || '').toString().trim().toLowerCase()
  : '';
const proxyEnabled = proxyFromNode || proxyFromAstro;
const enabled = (proxyEnabled === 'on' || proxyEnabled === 'true' || proxyEnabled === '1');
```

**Resultado:** 
- Proxy lee correctamente "on" de `process.env` en producción
- Status 200 OK
- Imágenes cargan correctamente

---

## Diagnóstico y Herramientas Creadas

### Endpoints de Debug

1. **`/api/test-env`** - Muestra variables de entorno en producción
2. **`/api/proxy-version`** - Verifica versión del código y valores leídos:
   ```json
   {
     "version": "3.0-dual-env",
     "debug": {
       "astroEnv": "off",
       "nodeEnv": "on",
       "combined": "on",
       "afterTrim": "on"
     }
   }
   ```
3. **`/api/wp-debug-raw`** - Simula fetch a WordPress desde servidor

### Comandos de Verificación

```powershell
# Probar proxy
Invoke-WebRequest -Uri 'https://artenlaclase.cl/api/img-proxy?url=...' -Method Head

# Ver env vars en producción
Invoke-RestMethod 'https://artenlaclase.cl/api/test-env'

# Verificar versión del código
Invoke-RestMethod 'https://artenlaclase.cl/api/proxy-version'
```

---

## Lecciones Aprendidas

1. **Variables de entorno en SSR:**
   - `import.meta.env` contiene valores de **build-time**
   - `process.env` contiene valores de **runtime** (producción)
   - Para páginas SSR, siempre leer de `process.env` cuando sea posible

2. **Prerendering vs SSR:**
   - Páginas prerenderizadas no tienen acceso a env vars de runtime
   - Usar `export const prerender = false;` para forzar SSR cuando se necesiten env vars dinámicas

3. **Sanitización de strings:**
   - Siempre aplicar `.trim()` a variables de entorno
   - Los espacios en blanco son invisibles pero causan errores críticos

4. **Debugging en producción:**
   - Crear endpoints de debug temporales es esencial
   - Verificar **qué valores** está leyendo el código, no asumir

5. **Diferencias build-time vs runtime:**
   - El archivo `.env` local puede tener valores diferentes a producción
   - Variables `PUBLIC_*` de Astro se "hornean" en el build
   - Variables sin `PUBLIC_` solo están disponibles en runtime server-side

---

## Archivos Modificados

1. **`src/utils/wp.ts`** - Agregar `.trim()` a WP_API_BASE y PUBLIC_WP_MEDIA_ROOT
2. **`src/pages/index.astro`** - Agregar `export const prerender = false;`
3. **`src/pages/api/img-proxy.ts`** - Leer de `process.env` además de `import.meta.env`
4. **`src/pages/api/proxy-version.ts`** - Endpoint de debug (temporal)

---

## Estado Final

✅ **RESUELTO** - Imágenes del blog cargan correctamente en https://artenlaclase.cl

- Homepage muestra 6 tarjetas de blog con imágenes
- Proxy responde con status 200
- WordPress API funciona correctamente
- SSR activo en homepage con acceso a env vars de producción
