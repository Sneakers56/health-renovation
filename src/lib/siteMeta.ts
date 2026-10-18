import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';
import { getServices, getPosts } from './content';
import site from '../data/site.json';
import testimonials from '../data/testimonials.json';
import type { ResolvedImage, SiteMeta } from '../puck/types';

const files = import.meta.glob<{ default: ImageMetadata }>('/src/assets/images/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG}', { eager: true });
export const imageFiles: Record<string, ImageMetadata> = Object.fromEntries(
  Object.entries(files).map(([path, mod]) => [path.split('/').pop()!, mod.default])
);

async function optimise(src: ImageMetadata, widths?: number[]): Promise<ResolvedImage> {
  const usable = widths?.filter((w) => w <= src.width);
  const img = await getImage({ src, format: 'webp', ...(usable?.length ? { widths: usable } : { width: Math.min(src.width, 600) }) });
  return {
    src: img.src,
    srcSet: usable?.length ? img.srcSet.attribute : undefined,
    width: Number(img.attributes.width) || src.width,
    height: Number(img.attributes.height) || src.height,
  };
}

function collectStrings(value: unknown, out: Set<string>) {
  if (typeof value === 'string') out.add(value);
  else if (Array.isArray(value)) value.forEach((v) => collectStrings(v, out));
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => collectStrings(v, out));
}

/** Site data handed to the blocks. With forEditor, returns every image at preview size. */
export async function buildSiteMeta(opts: { pageData?: unknown; forEditor?: boolean; current?: string }): Promise<SiteMeta> {
  const services = (await getServices()).map((s) => ({
    slug: s.id, title: s.title, excerpt: s.excerpt, duration: s.duration, color: s.color, icon: s.icon,
  }));
  const posts = (await getPosts({ includeDrafts: !!opts.forEditor })).map((p) => ({
    slug: p.id, title: p.title, description: p.description, date: p.date.toISOString(), draft: p.draft, image: p.image || undefined,
  }));

  let wanted: string[];
  if (opts.forEditor) {
    wanted = Object.keys(imageFiles);
  } else {
    const strings = new Set<string>();
    collectStrings(opts.pageData, strings);
    posts.forEach((p) => p.image && strings.add(p.image));
    wanted = Object.keys(imageFiles).filter((name) => strings.has(name));
  }
  const images: Record<string, ResolvedImage> = {};
  for (const name of wanted) {
    images[name] = await optimise(imageFiles[name], opts.forEditor ? undefined : [400, 800, 1200]);
  }

  return { site, services, posts, testimonials: testimonials.testimonials, images, current: opts.current };
}
