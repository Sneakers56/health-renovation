import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPublishedPosts } from '../lib/posts';
import site from '../data/site.json';

export async function GET(context: APIContext) {
  const posts = (await getPublishedPosts()).filter((p) => !p.data.draft);
  return rss({
    title: `${site.name} – Articles`,
    description: `Articles from ${site.practitioner} at ${site.name}`,
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: `/blog/${post.id}/`,
    })),
  });
}
