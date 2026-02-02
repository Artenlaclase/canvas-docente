# ✅ Guía de Validación de Optimizaciones SEO

## Verificación Rápida Local

### 1. Asegurar que todo compila correctamente
```bash
cd c:\proyectos\canvas-docente
npm run astro check
```
✅ Debe pasar sin errores críticos (warnings okay)

### 2. Construir el proyecto
```bash
npm run build
```
✅ Debe generar `dist/sitemap-index.xml` y `dist/sitemap-0.xml`

### 3. Verificar archivos generados
Después de `npm run build`, confirma:
- [ ] `dist/sitemap-index.xml` existe
- [ ] `dist/robots.txt` existe
- [ ] `dist/manifest.json` existe
- [ ] Archivos CSS/JS optimizados en `dist/_astro/`

---

## Verificación en Producción

### 1. **Google Search Console** (Herramienta oficial de Google)

**Pasos:**
1. Ir a [Google Search Console](https://search.google.com/search-console/)
2. Seleccionar propiedad "https://artenlaclase.cl"
3. Menú izquierdo → "Sitemaps"
4. Agregar: `https://artenlaclase.cl/sitemap-index.xml`
5. Esperar a que Google procese (24-48 horas)

**Validación:**
- [ ] Sitemap aparece como "Procesado"
- [ ] URLs indexadas aumenta con el tiempo
- [ ] Ningún error en "Cobertura"

---

### 2. **Open Graph Validation** (Redes Sociales)

**Herramienta**: [OpenGraph.xyz](https://www.opengraph.xyz/)

**Pasos:**
1. Ir a https://www.opengraph.xyz/
2. Ingresar URL: `https://artenlaclase.cl/blog/tu-articulo`
3. Ver preview de cómo aparecería en Facebook/LinkedIn

**Validación:**
- [ ] og:title aparece correctamente
- [ ] og:image se carga sin errores
- [ ] og:description es legible
- [ ] Aparece imagen en preview

---

### 3. **Twitter Card Validation**

**Herramienta**: [Twitter Card Validator](https://cards-dev.twitter.com/validator)

**Pasos:**
1. Ir al validador de Twitter
2. Ingresar URL: `https://artenlaclase.cl/galeria/tecnica/Pintura`
3. Analizar preview

**Validación:**
- [ ] Card type aparece como "summary_large_image"
- [ ] Imagen se muestra correctamente
- [ ] Título y descripción son claros

---

### 4. **Schema.org Validation** (Datos Estructurados)

**Herramienta**: [Schema.org Validator](https://validator.schema.org/)

**Pasos:**
1. Ir al validador
2. Ingresar URL: `https://artenlaclase.cl/blog/articulo`
3. Ejecutar validación

**Validación:**
- [ ] Schema "BlogPosting" detectado
- [ ] datePublished incluido
- [ ] author identificado
- [ ] image schema correcto
- [ ] Sin errores críticos

**Para Galería:**
- [ ] Schema "VisualArtwork" detectado
- [ ] creator identificado como Raúl Rosales
- [ ] image incluida

---

### 5. **Google Rich Results Test** (Mejor que Schema Validator)

**Herramienta**: [Rich Results Test](https://search.google.com/test/rich-results)

**Pasos:**
1. Ingresar URLs de blog y galería
2. Google analizará y mostrará cómo aparecerían en búsqueda

**Esperado:**
- [ ] Article rich results en blog
- [ ] Ningún error crítico
- [ ] Preview en SERP es atractivo

---

### 6. **PageSpeed Insights** (Performance + SEO)

**Herramienta**: [PageSpeed Insights](https://pagespeed.web.dev/)

**Pasos:**
1. Analizar: `https://artenlaclase.cl`
2. Analizar: `https://artenlaclase.cl/blog`
3. Analizar: `https://artenlaclase.cl/galeria`

**Validación:**
- [ ] Performance > 80
- [ ] Accessibility > 90
- [ ] Best Practices > 90
- [ ] SEO > 90
- [ ] Core Web Vitals "Good"

---

## Validaciones en Google Search Console

### Cobertura
- Ir a "Cobertura"
- Validar:
  - [ ] Páginas válidas > 10
  - [ ] Errores = 0
  - [ ] Advertencias = 0 (o mínimas)

### Rendimiento
- Ir a "Rendimiento"
- Validar después de 7-14 días:
  - [ ] Impresiones aumentan
  - [ ] CTR > 3%
  - [ ] Posición promedio < 15 (meta: < 5)

### Enhancemnt
- Ir a "Enhancments"
- Validar:
  - [ ] Mobile Usability = ✅
  - [ ] Rich Results procesados correctamente

---

## Monitoreo Continuo

### Semanal
- [ ] Revisar GSC por errores nuevos
- [ ] Verificar indexación de nuevas páginas
- [ ] Monitorear Core Web Vitals

### Mensual
- [ ] Revisar ranking keywords principales
- [ ] Analizar tráfico orgánico en Analytics
- [ ] Auditar 5-10 URLs con PageSpeed

### Trimestral
- [ ] Auditoría SEO completa
- [ ] Competencia Analysis
- [ ] Revisar técnicas nuevas de SEO

---

## Checklist Pre-Lanzamiento

Antes de actualizar producción:

```
Deploy
- [ ] npm run build ejecuta sin errores
- [ ] Todos los archivos en dist/ son legibles
- [ ] No hay console.errors en output
- [ ] Sitemap incluye todas las URLs principales
- [ ] robots.txt permite crawling

Testing Local
- [ ] Página de inicio carga rápido
- [ ] Blog post muestra metadatos en <head>
- [ ] Galería muestra op:image correctamente
- [ ] SchemaPerson.astro en todas las páginas

Después de Deploy
- [ ] URLs son accesibles públicamente
- [ ] No hay 404 en redireccionamientos
- [ ] Sitemap se puede descargar
- [ ] robots.txt es accesible en /robots.txt
- [ ] Google puede rastrear sin problemas
```

---

## Troubleshooting

### Sitemap no aparece en GSC
**Problema**: "Sitemap no se procesó"
**Solución**:
1. Verificar que `sitemap-index.xml` exista
2. Revisar permisos de lectura
3. Esperar 24-48 horas
4. Reintentar submit en GSC

### Schema no se detecta
**Problema**: Validator dice "No schema found"
**Solución**:
1. Verificar que SEO.astro esté en BaseLayout
2. Revisar en DevTools (F12 → ver source)
3. Confirmar que `<script type="application/ld+json">` existe
4. Validar JSON está correcto

### Open Graph no funciona en redes
**Problema**: Imagen no aparece en Facebook/LinkedIn
**Solución**:
1. Verificar URL de imagen es absoluta (https://...)
2. Imagen debe ser > 200x200px
3. Probar en [Open Graph Debugger de Facebook](https://developers.facebook.com/tools/debug/og/object/)
4. "Scrape Again" para limpiar cache

### Core Web Vitals malos
**Problema**: PageSpeed Insights muestra rojo
**Solución**:
1. Reducir tamaño de imágenes
2. Implementar lazy loading
3. Minificar CSS/JS
4. Usar CDN para assets estáticos

---

## Recursos Útiles

| Herramienta | URL | Propósito |
|-------------|-----|----------|
| Google Search Console | https://search.google.com/search-console/ | Oficial de Google para SEO |
| PageSpeed Insights | https://pagespeed.web.dev/ | Performance + SEO audit |
| Rich Results Test | https://search.google.com/test/rich-results | Schema validation |
| Schema Validator | https://validator.schema.org/ | JSON-LD validation |
| OpenGraph.xyz | https://www.opengraph.xyz/ | OG meta tags check |
| Twitter Validator | https://cards-dev.twitter.com/validator | Twitter Card preview |
| Google Analytics 4 | https://analytics.google.com/ | Tráfico y comportamiento |
| Lighthouse | DevTools → Lighthouse | Auditoría local |
| WAVE | https://wave.webaim.org/ | Accesibilidad |
| Screaming Frog | https://www.screamingfrog.co.uk/ | Crawl completo del sitio |

---

## Documentación Astro SEO

- [Astro SEO Guide](https://docs.astro.build/en/guides/integrations-guide/sitemap/)
- [Schema.org Docs](https://schema.org/)
- [Open Graph Protocol](https://ogp.me/)
- [Google Search Central](https://developers.google.com/search)

---

**Fecha de este documento**: 12 de Enero, 2026
**Versión**: 1.0
**Mantenedor**: Canvas Docente

