/**
 * Generador de Alt Text Automático para Galería
 * Proporciona descriptores de contexto educativo y artístico
 */

export interface AltTextConfig {
  technique: string;
  year?: number;
  school?: string;
  description?: string;
  isStudentWork?: boolean;
}

export function generateAltText(config: AltTextConfig): string {
  const {
    technique,
    year,
    school,
    description,
    isStudentWork = true,
  } = config;

  const parts: string[] = [];

  // Descripción principal
  if (description) {
    parts.push(description);
  } else {
    // Generar descripción por técnica
    const techniqueDescriptions: Record<string, string> = {
      'Pintura': 'Obra de pintura con técnica de color y composición',
      'Collage': 'Composición de collage con materiales diversos y texturas',
      'Audiovisual': 'Registro audiovisual y narrativa visual',
      'Mosaico': 'Mural de mosaico con teselas y patrones modulares',
      'Volumen': 'Obra tridimensional exploración de forma y espacio',
      'Máscaras': 'Diseño y creación de máscaras artesanales',
      'Lámparas': 'Lámpara artesanal con diseño e iluminación integrada',
      'Diseño': 'Lenguaje visual aplicado y composición gráfica',
      'Dibujo': 'Estudio dibujado con técnicas de línea y sombreado',
    };
    parts.push(techniqueDescriptions[technique] || `Obra de arte en técnica ${technique}`);
  }

  // Contexto educativo
  const contextParts: string[] = [];
  if (isStudentWork) {
    contextParts.push('realizada por estudiantes');
  }
  if (school) {
    contextParts.push(`${school}`);
  }
  if (year) {
    contextParts.push(`${year}`);
  }

  if (contextParts.length > 0) {
    parts.push(`(${contextParts.join(', ')})`);
  }

  return parts.join(' ').trim();
}

export const altTextTemplates = {
  pintura: {
    default: 'Obra de pintura con técnica de acrílicos, óleo o mixta',
    estudiantes: 'Estudiantes trabajando en técnica de pintura en clase de artes visuales',
    muralista: 'Mural pintado por estudiantes en contexto educativo',
  },
  collage: {
    default: 'Composición de collage con papeles y materiales diversos',
    reciclado: 'Collage con materiales reciclados en taller de arte',
    colaborativo: 'Trabajo colaborativo de estudiantes en composición de collage',
  },
  mosaico: {
    default: 'Mosaico con teselas de cerámica y patrones geométricos',
    comunitario: 'Mosaico mural realizado de forma colaborativa por estudiantes',
    tradicional: 'Técnica de mosaico tradicional con baldosas de cerámica',
  },
  volumen: {
    default: 'Obra tridimensional de escultura o construcción',
    arcilla: 'Escultura modelada en arcilla con técnica de modelado',
    papel: 'Construcción tridimensional en papel maché por estudiantes',
  },
  mascara: {
    default: 'Máscaras artesanales con técnica de papel maché',
    teatro: 'Máscaras diseñadas para performance y teatro',
    carnaval: 'Máscaras decorativas inspiradas en tradiciones carnavalescas',
  },
  lampara: {
    default: 'Lámpara artesanal con diseño de estructura y pantalla',
    reciclada: 'Luminaria creada con materiales reciclados',
    diseno: 'Lámpara con diseño experimental de luz y forma',
  },
  diseno: {
    afiche: 'Afiche diseñado con tipografía y composición gráfica',
    empaque: 'Prototipo de empaque diseñado en taller de diseño',
    editorial: 'Diseño editorial y composición visual de página',
  },
  dibujo: {
    observacion: 'Dibujo de observación realizado con modelo vivo',
    anatomia: 'Estudio de anatomía y proporciones dibujadas',
    tecnica: 'Estudio de técnicas de línea, sombreado y perspectiva',
  },
  audiovisual: {
    video: 'Captura de vídeo de proyecto audiovisual de estudiantes',
    animacion: 'Fotograma de animación y técnica stop-motion',
    cortometraje: 'Escena de cortometraje realizado por estudiantes',
  },
};
