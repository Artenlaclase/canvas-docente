# Variables de Entorno REQUERIDAS en Producción

## ⚠️ URGENTE: Imágenes del blog no cargan

Las imágenes del blog WordPress NO están cargando en producción porque el proxy está desactivado por defecto.

## ✅ SOLUCIÓN: Activar el proxy de imágenes

Agrega estas variables en tu servidor de producción (cPanel, Plesk, o donde esté alojado):

```bash
# ===== ACTIVAR PROXY DE IMÁGENES =====
PUBLIC_IMAGE_PROXY=on

# ===== SEGURIDAD DEL PROXY =====
# Genera un secreto aleatorio ejecutando este comando en tu servidor:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
IMAGE_PROXY_SECRET=tu_secreto_generado_aqui

# ===== RATE LIMITING =====
IMAGE_PROXY_RATE=120
IMAGE_PROXY_WINDOW_MS=300000

# ===== HOSTS PERMITIDOS =====
PUBLIC_IMAGE_PROXY_ALLOW=api.artenlaclase.cl|artenlaclase.cl
```

## 📝 Pasos a seguir:

### 1. Genera un secreto seguro:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Esto generará algo como:
```
a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

### 2. Agrega las variables en tu servidor:

**Si usas cPanel:**
- Software > Select PHP Version > Switch To PHP Options
- Agrega cada variable con su valor

**Si usas SSH/Terminal:**
```bash
nano .env
# Pega las variables arriba
```

**Si usas PM2:**
```bash
pm2 stop all
# Edita .env o ecosystem.config.js
pm2 restart all
```

### 3. Reinicia la aplicación:

```bash
pm2 restart canvas-docente
# O si usas otro gestor de procesos, reinicia el servicio
```

### 4. Verifica que funciona:

Visita https://artenlaclase.cl/ y verifica que las tarjetas del blog ahora muestran las imágenes.

## 🔍 ¿Por qué es necesario?

El servidor WordPress (`api.artenlaclase.cl`) tiene **protección de hotlinking** que bloquea las solicitudes directas de imágenes desde otros dominios. El proxy interno `/api/img-proxy` soluciona esto haciendo las peticiones desde el servidor (server-side) y entregando las imágenes a los navegadores.

## 📊 Variables Actuales Verificadas:

✅ `WP_API_BASE=https://api.artenlaclase.cl/wp-json/wp/v2`
✅ `PUBLIC_WP_MEDIA_ROOT=https://api.artenlaclase.cl`
✅ `PUBLIC_UMAMI_WEBSITE_ID=d42696c6-7d19-4a9f-9cde-29540ce5e907`
✅ `PUBLIC_UMAMI_SCRIPT_URL=https://cloud.umami.is/script.js`

❌ `PUBLIC_IMAGE_PROXY` - **FALTA (por eso no cargan las imágenes)**
❌ `IMAGE_PROXY_SECRET` - **FALTA**
❌ `IMAGE_PROXY_RATE` - **FALTA**
❌ `IMAGE_PROXY_WINDOW_MS` - **FALTA**
❌ `PUBLIC_IMAGE_PROXY_ALLOW` - **FALTA**

## 🚨 Alternativa (si no puedes activar el proxy):

Si por alguna razón no puedes activar el proxy, la alternativa es **desactivar la protección de hotlinking** en el servidor WordPress:

**En .htaccess de api.artenlaclase.cl:**
```apache
# Permitir hotlinking desde artenlaclase.cl
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{HTTP_REFERER} !^$
  RewriteCond %{HTTP_REFERER} !^https?://(www\.)?artenlaclase\.cl [NC]
  RewriteCond %{HTTP_REFERER} !^https?://(www\.)?api\.artenlaclase\.cl [NC]
  RewriteRule \.(jpg|jpeg|png|gif|webp|svg)$ - [F,NC]
</IfModule>
```

Pero **la opción del proxy es más segura y recomendada**.
