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
    TechniqueFilter.astro
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
    contacto.astro
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

### Notas
- Los estilos de Tailwind están en `src/styles/global.css` y se importan en `BaseLayout.astro`.
- Si ves advertencias en el editor sobre `@tailwind` o `@apply`, son del analizador estático del editor. En la compilación real de Astro se procesan con PostCSS/Tailwind.
