import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const seo = z
  .object({
    title: z.string().optional(),
    description: z.string().optional(),
    noindex: z.boolean().optional(),
  })
  .optional();


const opt = z.string().optional();

const services = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/services' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      order: z.number(),
      color: z.enum(['green', 'teal', 'amber', 'blue', 'purple', 'rose']),
      icon: z.string(),
      image: image(),
      duration: z.string(),
      tagline: z.string(),
      excerpt: z.string(),
      benefits: z.array(z.string()),
      seo,
    }),
});

const posts = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/posts' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      date: z.coerce.date(),
      image: image().optional(),
      imageAlt: opt,
      draft: z.boolean().default(false),
    }),
});

const pages = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/pages' }),
  schema: z.object({
    root: z.object({
      props: z.object({
        title: z.string(),
        seoTitle: z.string().optional(),
        seoDescription: z.string().optional(),
        noindex: z.boolean().optional(),
      }).passthrough(),
    }),
    content: z.array(z.object({ type: z.string(), props: z.record(z.string(), z.any()) }).passthrough()),
    zones: z.record(z.string(), z.any()).optional(),
  }),
});

export const collections = { services, posts, pages };
