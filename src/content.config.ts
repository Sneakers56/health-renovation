import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/** Every editable document is a Puck document: details in root.props, body as blocks in content. */
const blocks = z.array(z.object({ type: z.string(), props: z.record(z.string(), z.any()) }).passthrough());
const doc = <T extends z.ZodRawShape>(props: T) =>
  z.object({
    root: z.object({ props: z.object(props).passthrough() }),
    content: blocks.default([]),
    zones: z.record(z.string(), z.any()).optional(),
  });

const opt = z.string().optional();

const services = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/services' }),
  schema: doc({
    title: z.string(),
    order: z.coerce.number().default(99),
    tagline: z.string().default(''),
    excerpt: z.string().default(''),
    duration: z.string().default(''),
    image: z.string().default(''),
    imageAlt: opt,
    color: z.enum(['green', 'teal', 'amber', 'blue', 'purple', 'rose']).catch('green'),
    icon: z.string().default('check'),
    benefits: z.array(z.object({ text: z.string() })).default([]),
    seoTitle: opt,
    seoDescription: opt,
    noindex: z.boolean().optional(),
  }),
});

const posts = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/posts' }),
  schema: doc({
    title: z.string(),
    description: z.string().default(''),
    date: z.coerce.date(),
    image: opt,
    imageAlt: opt,
    draft: z.boolean().default(true),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/pages' }),
  schema: doc({
    title: z.string(),
    seoTitle: opt,
    seoDescription: opt,
    noindex: z.boolean().optional(),
  }),
});

export const collections = { services, posts, pages };
