import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPosts } from '../lib/content';
import site from '../data/site.json';

export async function GET(context: APIContext) {
  const posts = await getPosts({ includeDrafts: false });
  return rss({
    title: `${site.name} – Articles`,
    description: `Articles from ${site.practitioner} at ${site.name}`,
    site: context.site!,
    items: posts.map((post) => ({ title: post.title, description: post.description, pubDate: post.date, link: `/blog/${post.id}/` })),
  });
}
