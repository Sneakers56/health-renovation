import { getCollection } from 'astro:content';
import { icons } from '../../lib/icons';
import { getPublishedPosts } from '../../lib/posts';
import site from '../../data/site.json';
import testimonials from '../../data/testimonials.json';

export async function GET() {
  const services = (await getCollection('services'))
    .sort((a, b) => a.data.order - b.data.order)
    .map((s) => ({ title: s.data.title, excerpt: s.data.excerpt, duration: s.data.duration, color: s.data.color, icon: s.data.icon }));
  const posts = (await getPublishedPosts()).map((p) => ({ title: p.data.title, description: p.data.description, date: p.data.date.toISOString() }));
  const data = { icons, site, services, posts, testimonials: testimonials.testimonials };
  return new Response(`window.HR = ${JSON.stringify(data)};`, {
    headers: { 'Content-Type': 'text/javascript; charset=utf-8' },
  });
}
