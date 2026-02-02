# Guía SEO para Imágenes - Canvas Docente

## Nombres de Archivo

Los nombres de archivo importan para SEO. Deben ser descriptivos en lugar de genéricos como `IMG_2024.jpg`.

### Convenciones Recomendadas

**Patrón general:**
```
tecnica-descripcion-breve-ano.jpg
```

**Ejemplos correctos:**
- ✅ `pintura-acrilica-naturaleza-muerta-2024.jpg`
- ✅ `mosaico-estudiantes-trabajo-colaborativo-2023.jpg`
- ✅ `volumen-escultura-arcilla-profesor-demo.jpg`
- ✅ `collage-materiales-reciclados-taller-clase.jpg`
- ✅ `mascara-carnaval-tecnica-papier-mache.jpg`

**Ejemplos incorrectos (evitar):**
- ❌ `IMG_2024.JPG`
- ❌ `WhatsApp_Image_2024.jpg`
- ❌ `scan123.jpg`
- ❌ `photo(1).jpg`

### Beneficios
- 📈 Mejor indexación en Google Images
- 🔍 Mejora la búsqueda por imagen
- 📱 Mejora en búsquedas por voz
- ♿ Mejor accesibilidad general

---

## Alt Text (Atributo `alt`)

El `alt` text es crítico para:
- SEO
- Accesibilidad (lectores de pantalla)
- UX cuando falla carga de imagen

### Guía de Escritura

**Reglas generales:**
1. Ser descriptivo pero conciso (máx. 125 caracteres)
2. Incluir contexto relevante: qué, quién, dónde si aplica
3. Mencionar técnica, material o proceso si es educativo
4. Evitar "imagen de...", "foto de...", "cuadro de..."
5. Incluir el año si es relevante

### Ejemplos por Técnica

#### Pintura
```
❌ "Pintura"
❌ "Cuadro de arte"
✅ "Estudiantes de secundaria pintando con acrílicos en clase de artes"
✅ "Naturaleza muerta con frutas y flores, técnica mixta, 2024"
```

#### Mosaico
```
❌ "Mosaico"
✅ "Mural de mosaico creado por estudiantes con teselas de cerámica de colores"
✅ "Patrón geométrico en mosaico con baldosas tradicionales"
```

#### Volumen/Escultura
```
❌ "Escultura"
✅ "Maqueta tridimensional de arcilla modelada en taller de arte"
✅ "Estudiantes trabajando en escultura de papel maché en clase colaborativa"
```

#### Collage
```
❌ "Collage"
✅ "Composición de collage con papeles de revista y materiales reciclados"
✅ "Taller de estudiantes creando composición visual con papel y texturas"
```

#### Máscaras
```
❌ "Máscaras"
✅ "Máscaras de papel maché con diseños de animales para taller de teatro"
✅ "Estudiantes modelando máscaras coloridas con técnica tradicional"
```

#### Lámparas
```
❌ "Lámpara"
✅ "Lámpara artesanal con pantalla de papel reciclado y estructura de madera"
✅ "Diseño de luminaria creada en taller de estudiantes de artes aplicadas"
```

#### Diseño
```
❌ "Diseño"
✅ "Afiche para evento cultural con tipografía experimental en dos colores"
✅ "Prototipo de empaque diseñado en taller de diseño gráfico"
```

#### Dibujo
```
❌ "Dibujo"
✅ "Dibujo a carboncillo con técnica de sombreado de modelo vivo"
✅ "Estudios de anatomía y gesto dibujados en clase de observación"
```

#### Audiovisual
```
❌ "Video"
✅ "Captura de pantalla del proceso de animación frame a frame con técnica stop-motion"
✅ "Escena de cortometraje realizado por estudiantes con cámara digital"
```

---

## Implementación en Astro

### Para imágenes estáticas:

```astro
---
import { Image } from 'astro:assets';
import pintura from '../../assets/images/pintura-acrilica-naturaleza-muerta-2024.jpg';
---

<Image 
  src={pintura} 
  alt="Naturaleza muerta pintada con acrílicos en taller de estudiantes de secundaria"
  width={800}
  height={600}
/>
```

### Para imágenes dinámicas (galería):

```astro
{
  techniqueImages.map((img, idx) => (
    <img 
      src={img.src}
      alt={altTexts[idx]} // Mapa de descriptivos
      loading="lazy"
      decoding="async"
    />
  ))
}
```

---

## Nombres de Archivo - Renombrados Recomendados

### Pintura
- `pintura-acrilica-clase-arte.jpg`
- `pintura-naturaleza-muerta-composicion.jpg`
- `pintura-expresionismo-abstracto-estudiantes.jpg`

### Mosaico
- `mosaico-estudiantes-trabajo-colaborativo.jpg`
- `mosaico-teselas-ceramica-patron.jpg`
- `mosaico-mural-comunitario.jpg`

### Volumen
- `volumen-arcilla-modelado-taller.jpg`
- `volumen-papel-mache-construccion.jpg`
- `volumen-escultura-tridimensional.jpg`

### Máscaras
- `mascara-papel-mache-coloridas.jpg`
- `mascara-teatro-performance-estudiantes.jpg`
- `mascara-carnaval-diseno-tradicional.jpg`

### Collage
- `collage-materiales-reciclados-clase.jpg`
- `collage-papel-revista-composicion.jpg`
- `collage-texturas-mixtas-arte.jpg`

### Lámparas
- `lampara-artesanal-papel-reciclado.jpg`
- `lampara-diseño-estructura-madera.jpg`
- `lampara-luz-ambiente-taller.jpg`

### Diseño
- `diseno-afiche-tipografia-experimental.jpg`
- `diseno-empaque-prototipo.jpg`
- `diseno-grafico-composicion-visual.jpg`

### Dibujo
- `dibujo-carboncillo-modelo-vivo.jpg`
- `dibujo-estudio-anatomia-observacion.jpg`
- `dibujo-linea-sombreado-tecnica.jpg`

### Audiovisual
- `audiovisual-stop-motion-frame.jpg`
- `audiovisual-cortometraje-estudiantes.jpg`
- `audiovisual-captura-pantalla-video.jpg`

---

## Herramientas Útiles

- **Google Search Console**: Inspecciona cómo Google ve tus imágenes
- **Google Images**: Verifica cómo aparecen tus imágenes en búsqueda
- **WAVE WebAIM**: Valida accesibilidad de alt text
- **Lighthouse**: Auditoría automática de SEO en DevTools

---

## Checkpoints de Auditoría

Para cada imagen verifica:

- [ ] Nombre de archivo es descriptivo (no genérico)
- [ ] Alt text describe claramente qué se ve
- [ ] Alt text incluye técnica/contexto educativo
- [ ] Alt text es < 125 caracteres
- [ ] Imagen tiene dimensiones apropiadas
- [ ] Imagen está optimizada (WebP, lazy loading)
- [ ] No hay duplicación de información con caption/texto adyacente

