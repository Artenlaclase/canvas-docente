# 🚀 Guía Rápida - Cómo Probar las Optimizaciones UX

## Estado Actual
✅ **Build compilado exitosamente**  
✅ **Preview ejecutándose en http://localhost:3000**  
✅ **Todas las optimizaciones funcionando**

---

## 📱 1. Prueba la Navegación Móvil Mejorada

### En Desktop (Simular móvil)
1. Abre http://localhost:3000
2. Presiona `F12` para abrir Developer Tools
3. Haz clic en el icono de dispositivo móvil (o `Ctrl+Shift+M`)
4. Cambia a vista de móvil (iPhone 12 o similar)

### En la página
1. Busca el icono hamburguesa (☰) en la parte superior derecha
2. Haz clic para abrir el menú
3. Observa:
   - ✅ Navegación principal (Inicio, Notas, Experiencia, Contacto)
   - ✅ **Top 3 técnicas** con emojis (🎨 Pintura, ✂️ Collage, 📹 Audiovisual)
   - ✅ Botón "▼ Más técnicas" expandible
   - ✅ Otras 6 técnicas dentro (Mosaico, Volumen, etc.)

**Beneficio:** No abruma al usuario con demasiadas opciones

---

## 🖼️ 2. Prueba el Lightbox con Swipe

### Ir a la Galería
1. Abre http://localhost:3000/galeria
2. Haz clic en cualquier imagen (técnica como Pintura, Collage, etc.)

### En Desktop
1. Se abre un modal con la imagen ampliada
2. Haz clic en las **flechas** (◄ ►) para navegar
3. Observa:
   - ✅ Contador dinámico ("2 / 15")
   - ✅ Título de la imagen abajo
   - ✅ Botón X para cerrar
   - ✅ Puedes hacer doble clic para zoom

### En Móvil
1. Abre la misma galería en móvil
2. Haz clic en una imagen
3. **Desliza con el dedo** hacia los lados:
   - Desliza hacia la **izquierda** = siguiente imagen
   - Desliza hacia la **derecha** = imagen anterior
4. Observa las transiciones suaves

**Beneficio:** Navegación natural y fluida sin botones pequeños

---

## 📚 3. Prueba Contenido Relacionado + CTAs

### En un Post de Blog
1. Abre http://localhost:3000/notas (Sección de Notas/Blog)
2. Haz clic en cualquier artículo para abrirlo
3. Desplázate al **final del post**
4. Observa:
   - ✅ Sección "**Artículos Relacionados**" (3 posts con imágenes)
   - ✅ Bloque de **CTA**: "¿Quieres colaborar o aprender más?"
   - ✅ Botón primario: **"Contactar"** (enlace a formulario)
   - ✅ Botón secundario: **"Ver Galería"** (explora más)

### En una Página de Técnica
1. Abre http://localhost:3000/galeria/tecnica/Pintura
2. Desplázate al **final de la página** (después de imágenes/videos)
3. Observa:
   - ✅ Sección "**Más en Galería**" (3 técnicas aleatorias)
   - ✅ Bloque de **CTA** con contexto diferente
   - ✅ Botones: **"Contactar"** y **"Leer Notas"**

**Beneficio:** Guía al usuario hacia el siguiente paso (aumenta conversiones)

---

## 🌙 4. Prueba el Modo Oscuro

### Ubicar el Toggle
1. Abre cualquier página (http://localhost:3000)
2. Busca en el **header superior derecho**
3. Junto a las redes sociales (Instagram, YouTube, etc.)
4. Verás un icono: **☀️** (sol, modo claro) o **🌙** (luna, modo oscuro)

### Alternar Tema
1. Haz clic en el icono
2. Observa:
   - ✅ La página **oscurece suavemente** (transición)
   - ✅ Texto se vuelve claro (blanco/gris)
   - ✅ Fondos oscuros (slate-950)
   - ✅ El icono cambia a **☀️** o **🌙**

### Verificar Persistencia
1. Cierra la pestaña o recarga (F5)
2. El tema **se mantiene** (guardado en localStorage)
3. Prueba en diferentes páginas:
   - Home: http://localhost:3000
   - Galería: http://localhost:3000/galeria
   - Blog: http://localhost:3000/notas
   - Contacto: http://localhost:3000/#contacto

### Elementos que Cambian
- ✅ Fondo de página (blanco → oscuro)
- ✅ Texto (oscuro → claro)
- ✅ Header y footer (oscurecidos)
- ✅ Inputs de formulario
- ✅ Botones y bordes
- ✅ Tarjetas de contenido
- ✅ Contenido de blog (prose)

**Beneficio:** Menos fatiga visual, mejor para arte (fondo oscuro)

---

## 🎯 Checklist de Verificación Completa

Copia este checklist y marca cada paso:

```
NAVEGACIÓN MÓVIL MEJORADA
□ Menú hamburguesa abre/cierra
□ Top 3 técnicas visibles sin expandir
□ Sección "Más técnicas" expandible
□ Emojis funcionan en todos los items
□ Menú cierra al seleccionar enlace
□ Responsive en móvil

LIGHTBOX CON SWIPE
□ Galería abre en modal al hacer clic
□ Contador muestra correctamente ("X / Y")
□ Título de imagen visible abajo
□ Botones flecha funcionan en desktop
□ Swipe funciona en móvil (izq/der)
□ Doble clic hace zoom
□ Escape cierra el modal

CONTENIDO RELACIONADO + CTAs
□ Posts de blog muestran artículos relacionados
□ Páginas de técnicas muestran más técnicas
□ CTA bloque visible con gradiente
□ Botón "Contactar" funciona
□ Botones secundarios funcionan
□ Imágenes cargan correctamente
□ Responsive en móvil

DARK MODE
□ Toggle visible en header (☀️🌙)
□ Tema alterna al hacer clic
□ Transición suave entre temas
□ Tema persiste después de recargar
□ Texto legible en modo oscuro
□ Contraste adecuado
□ Funciona en todas las páginas
□ Icono cambia dinámicamente
```

---

## 🐛 Solución de Problemas

### "El menú móvil no aparece en desktop"
- ✅ Correcto. Solo aparece en pantallas pequeñas (< 640px)
- Prueba: Reduce el ancho del navegador o usa vista de móvil (F12)

### "El swipe no funciona en desktop"
- ✅ Correcto. El swipe solo funciona en dispositivos táctiles
- Para probar en desktop: Usa DevTools móvil (F12) o dispositivo real

### "El dark mode no persiste"
- Verifica localStorage: F12 → Application → Storage → Local Storage
- Debe existir entrada `theme: dark` o `theme: light`

### "Las imágenes no cargan"
- Verifica conexión a WordPress
- Console (F12) debe mostrar: "[probe] WordPress API accesible"

### "El build falla"
- Si ves error `bg-slate-950/98`, cambia a `bg-slate-950/95` en global.css
- Los valores válidos de opacidad en Tailwind son: 5, 10, 15... 95

---

## 📊 Métricas para Monitorear

Después de implementar, monitorear estos KPIs:

| Métrica | Cómo Medir | Objetivo |
|---------|-----------|----------|
| **Bounce Rate** | Google Analytics | ↓ 15-20% |
| **Pages/Session** | Google Analytics | ↑ 25-35% |
| **Time on Page** | Google Analytics | ↑ 30-40% |
| **Mobile Traffic** | Google Analytics | Debe aumentar con nav mejorada |
| **Conversiones (Contacto)** | Google Analytics Goals | ↑ 20-30% |

---

## 💾 Comando para Deployer

Cuando estés listo para producción:

```bash
# Build para producción
npm run build

# Preview en local (verification)
npm run preview

# Deploy a servidor
# (Depende de tu hosting, ej: Vercel, Netlify, etc)
```

---

## 📞 Documentación Completa

Para detalles técnicos, consulta:
- **`OPTIMIZACIONES_UX_IMPLEMENTADAS.md`** - Documentación completa
- **`DIAGRAMA_CAMBIOS_UX.md`** - Diagramas y arquitectura
- **`VERIFICACION_IMPLEMENTACION.md`** - Estado técnico actual

---

## ✨ ¡Listo para Usar!

Todas las optimizaciones están implementadas y funcionando.  
El servidor preview está ejecutándose en **http://localhost:3000**

**Próximos pasos:**
1. ✅ Prueba localmente con las guías arriba
2. ✅ Verifica en dispositivos reales (móvil/tablet)
3. ✅ Implementa Google Analytics para medir impacto
4. ✅ Considera recolectar feedback de usuarios
5. ✅ Deploy a producción cuando esté listo

---

*Generado: 13 de enero de 2026*  
*Proyecto: Canvas Docente - Optimizaciones UX*
