import { defineCollection, z } from 'astro:content';

const galeria = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    technique: z.enum([
      'Pintura', 'Collage', 'Audiovisual', 'Mosaico', 'Volumen', 'Máscaras', 'Lámparas', 'Diseño', 'Dibujo'
    ]),
    year: z.number().int(),
    description: z.string().optional(),
    school: z.string().optional(),
    cover: z.string().optional(),
    images: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
  }),
});

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    excerpt: z.string().optional(),
    date: z.coerce.date(),
    cover: z.string().optional(),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { galeria, blog };
