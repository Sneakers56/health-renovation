import { getCollection } from 'astro:content';

/** Services and posts are Puck documents; these helpers flatten root.props for templates. */
export async function getServices() {
  const all = await getCollection('services');
  return all
    .map((s) => ({ id: s.id, ...s.data.root.props, doc: s.data }))
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

export async function getPosts({ includeDrafts = import.meta.env.DEV } = {}) {
  const all = await getCollection('posts');
  return all
    .map((p) => ({ id: p.id, ...p.data.root.props, doc: p.data }))
    .filter((p) => includeDrafts || !p.draft)
    .sort((a, b) => b.date.valueOf() - a.date.valueOf());
}

export type Service = Awaited<ReturnType<typeof getServices>>[number];
export type Post = Awaited<ReturnType<typeof getPosts>>[number];

export const formatDate = (date: Date) =>
  date.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
