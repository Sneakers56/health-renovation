import { useCallback, useEffect, useRef, useState } from 'react';
import { Puck } from '@puckeditor/core';
import '@puckeditor/core/puck.css';
import './editor.css';
import { pageConfig, serviceConfig, postConfig } from './config';
import { navigationConfig, testimonialsConfig, siteConfig } from './settings';
import { setLibrary } from './library';
import type { SiteMeta } from './types';
import {
  type Storage,
  type DocSummary,
  AuthError,
  localAvailable,
  localStorageBackend,
  existingGithubToken,
  forgetGithubToken,
  loginWithGithub,
  githubStorage,
} from './storage';

// In local dev, saving files makes Vite reload open pages, which would wipe unsaved edits in the editor.
// Throwing from this listener cancels the reload.
if (import.meta.hot) {
  import.meta.hot.on('vite:beforeFullReload', () => {
    throw new Error('(editor) skipped full reload');
  });
}

const uid = () => crypto.randomUUID();
const today = () => new Date().toISOString().slice(0, 10);
const slugify = (s: string) =>
  s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const textBlock = (html: string) => ({ type: 'RichText', props: { id: `RichText-${uid()}`, content: html, align: 'left', size: 'normal', hidden: false } });

type Collection = {
  type: 'collection';
  label: string;
  singular: string;
  dir: string;
  config: any;
  url: (slug: string) => string;
  reserved?: string[];
  undeletable?: string[];
  sort: (a: DocSummary, b: DocSummary) => number;
  describe?: (d: DocSummary) => string;
  newDoc: (title: string, docs: DocSummary[]) => any;
  createdNote: (slug: string) => string;
};
type SettingsFile = { type: 'file'; label: string; path: string; config: any; url: string };
type Tab = Collection | SettingsFile;

const TABS: Record<string, Tab> = {
  pages: {
    type: 'collection',
    label: 'Pages',
    singular: 'page',
    dir: 'src/content/pages',
    config: pageConfig,
    url: (s) => (s === 'home' ? '/' : `/${s}/`),
    reserved: ['home', 'services', 'blog', 'thanks', 'admin', 'editor', '404', 'rss-xml'],
    undeletable: ['home'],
    sort: (a, b) => (a.slug === 'home' ? -1 : b.slug === 'home' ? 1 : a.title.localeCompare(b.title)),
    newDoc: (title) => ({
      root: { props: { title, seoTitle: '', seoDescription: '', noindex: false } },
      content: [
        { type: 'Banner', props: { id: `Banner-${uid()}`, eyebrow: '', heading: title, subtitle: '', colour: 'teal', hidden: false } },
        { type: 'TextSection', props: { id: `TextSection-${uid()}`, eyebrow: '', heading: '', body: '<p>Start writing here, or drag blocks in from the left.</p>', align: 'left', background: 'white', hidden: false } },
      ],
    }),
    createdNote: (slug) => `Created /${slug}/. Add it to the menu in the Menu tab.`,
  },
  services: {
    type: 'collection',
    label: 'Services',
    singular: 'service',
    dir: 'src/content/services',
    config: serviceConfig,
    url: (s) => `/services/${s}/`,
    sort: (a, b) => (a.props.order ?? 99) - (b.props.order ?? 99) || a.title.localeCompare(b.title),
    newDoc: (title, docs) => ({
      root: {
        props: {
          title, tagline: '', excerpt: '', duration: '', image: '', imageAlt: '', benefits: [],
          order: Math.max(0, ...docs.map((d) => Number(d.props.order) || 0)) + 1,
          color: 'green', icon: 'check', seoTitle: '', seoDescription: '', noindex: false,
        },
      },
      content: [textBlock('<p>Describe the service here.</p>')],
    }),
    createdNote: (slug) => `Created /services/${slug}/. It appears in the menu, footer and services grid automatically.`,
  },
  posts: {
    type: 'collection',
    label: 'Blog',
    singular: 'article',
    dir: 'src/content/posts',
    config: postConfig,
    url: (s) => `/blog/${s}/`,
    sort: (a, b) => String(b.props.date ?? '').localeCompare(String(a.props.date ?? '')),
    describe: (d) => `${d.title}${d.props.draft ? ' (draft)' : ''}`,
    newDoc: (title) => ({
      root: { props: { title, description: '', date: today(), image: '', imageAlt: '', draft: true } },
      content: [textBlock('<p>Write your article here.</p>')],
    }),
    createdNote: () => 'Article created as a draft. Set “Draft” to No in the panel when it’s ready, then Publish.',
  },
  menu: { type: 'file', label: 'Menu', path: 'src/data/navigation.json', config: navigationConfig, url: '/' },
  testimonials: { type: 'file', label: 'Testimonials', path: 'src/data/testimonials.json', config: testimonialsConfig, url: '/' },
  site: { type: 'file', label: 'Business details', path: 'src/data/site.json', config: siteConfig, url: '/contact/' },
};

const viewports = [
  { width: 375, label: 'Phone', icon: 'Smartphone' as const },
  { width: 768, label: 'Tablet', icon: 'Tablet' as const },
  { width: 1280, label: 'Desktop', icon: 'Monitor' as const },
];

type Status = { kind: 'info' | 'ok' | 'error'; text: string } | null;
type Loaded = { data: any; sha?: string; original?: any };

export default function Editor() {
  const params = new URLSearchParams(location.search);
  const [storage, setStorage] = useState<Storage | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [meta, setMeta] = useState<SiteMeta | null>(null);
  const [tabId, setTabId] = useState(() => (params.get('tab') && TABS[params.get('tab')!] ? params.get('tab')! : 'pages'));
  const [slug, setSlug] = useState(() => params.get('doc') || 'home');
  const [docs, setDocs] = useState<DocSummary[]>([]);
  const [doc, setDoc] = useState<Loaded | null>(null);
  const [status, setStatus] = useState<Status>({ kind: 'info', text: 'Loading…' });
  const dirty = useRef(false);
  const tab = TABS[tabId];

  const fail = useCallback((e: unknown) => {
    if (e instanceof AuthError) {
      forgetGithubToken();
      setStorage(null);
      setNeedsLogin(true);
    }
    setStatus({ kind: 'error', text: e instanceof Error ? e.message : String(e) });
  }, []);

  const loadMeta = useCallback(() => fetch('/editor/data.json', { cache: 'no-store' }).then((r) => r.json()).then(setMeta), []);
  useEffect(() => {
    loadMeta().catch(() => setStatus({ kind: 'error', text: 'Could not load site data.' }));
  }, [loadMeta]);

  // Local files while developing, GitHub on the live site
  useEffect(() => {
    (async () => {
      if (['localhost', '127.0.0.1'].includes(location.hostname)) {
        if (await localAvailable()) return setStorage(localStorageBackend);
        return setStatus({ kind: 'error', text: 'Local saving needs the dev server: run `npm run dev`.' });
      }
      const token = existingGithubToken();
      if (token) setStorage(githubStorage(token));
      else {
        setNeedsLogin(true);
        setStatus(null);
      }
    })();
  }, []);

  async function login() {
    try {
      const token = await loginWithGithub();
      setNeedsLogin(false);
      setStorage(githubStorage(token));
    } catch (e) {
      fail(e);
    }
  }

  useEffect(() => {
    if (!storage) return;
    setLibrary({
      upload: async (file: File) => {
        if (file.size > 8 * 1024 * 1024) throw new Error('Please use a photo under 8 MB.');
        const ext = (file.name.match(/\.(jpe?g|png|webp)$/i)?.[1] ?? 'jpg').toLowerCase().replace('jpeg', 'jpg');
        const base = slugify(file.name.replace(/\.[^.]+$/, '')) || 'photo';
        let name = `${base}.${ext}`;
        for (let i = 2; await storage.imageExists(name); i++) name = `${base}-${i}.${ext}`;
        await storage.uploadImage(name, file);
        const src = URL.createObjectURL(file);
        setLibrary({ images: { [name]: { src } } });
        setMeta((m) => (m ? { ...m, images: { ...m.images, [name]: { src } } } : m));
        return name;
      },
    });
  }, [storage]);

  useEffect(() => {
    if (meta) setLibrary({ images: meta.images });
  }, [meta]);

  const refreshDocs = useCallback(async () => {
    if (!storage || tab.type !== 'collection') return setDocs([]);
    const list = await storage.listDocs(tab.dir);
    setDocs(list.sort(tab.sort));
    return list;
  }, [storage, tab]);

  useEffect(() => {
    refreshDocs()?.catch(fail);
  }, [refreshDocs, fail]);

  // Load the selected document
  useEffect(() => {
    if (!storage) return;
    let cancelled = false;
    setDoc(null);
    setStatus({ kind: 'info', text: 'Loading…' });
    (async () => {
      try {
        if (tab.type === 'file') {
          const { text, sha } = await storage.read(tab.path);
          const original = JSON.parse(text);
          if (!cancelled) setDoc({ data: { root: { props: original }, content: [] }, sha, original });
        } else {
          const list = docs.length ? docs : (await storage.listDocs(tab.dir)).sort(tab.sort);
          const target = list.find((d) => d.slug === slug) ? slug : list[0]?.slug;
          if (!target) {
            if (!cancelled) setStatus({ kind: 'info', text: `No ${tab.label.toLowerCase()} yet – click “+ New ${tab.singular}”.` });
            return;
          }
          if (target !== slug) return setSlug(target);
          const { text, sha } = await storage.read(`${tab.dir}/${target}.json`);
          if (!cancelled) setDoc({ data: JSON.parse(text), sha });
        }
        if (!cancelled) {
          setStatus(null);
          dirty.current = false;
          history.replaceState(null, '', `?tab=${tabId}${tab.type === 'collection' ? `&doc=${slug}` : ''}`);
        }
      } catch (e) {
        if (!cancelled) fail(e);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storage, tabId, slug]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty.current) e.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);

  const confirmLeave = () => !dirty.current || confirm('You have unpublished changes. Discard them?');

  function switchTab(next: string) {
    if (next === tabId || !confirmLeave()) return;
    setDocs([]);
    setTabId(next);
    setSlug(next === 'pages' ? 'home' : '');
  }

  function switchDoc(next: string) {
    if (next !== slug && confirmLeave()) setSlug(next);
  }

  async function createDoc() {
    if (!storage || tab.type !== 'collection' || !confirmLeave()) return;
    const title = prompt(`Name of the new ${tab.singular}:`)?.trim();
    if (!title) return;
    const newSlug = slugify(title);
    if (!newSlug || tab.reserved?.includes(newSlug) || docs.some((d) => d.slug === newSlug)) {
      return alert(`“${newSlug}” is already used or reserved. Try another name.`);
    }
    setStatus({ kind: 'info', text: 'Creating…' });
    try {
      await storage.write(`${tab.dir}/${newSlug}.json`, JSON.stringify(tab.newDoc(title, docs), null, 2) + '\n');
      await refreshDocs();
      setSlug(newSlug);
      setTimeout(() => setStatus({ kind: 'ok', text: tab.createdNote(newSlug) }), 600);
    } catch (e) {
      fail(e);
    }
  }

  async function deleteDoc() {
    if (!storage || tab.type !== 'collection' || !doc || tab.undeletable?.includes(slug)) return;
    if (!confirm(`Delete “${doc.data.root?.props?.title}”? This can’t be undone here.`)) return;
    try {
      await storage.remove(`${tab.dir}/${slug}.json`, doc.sha);
      dirty.current = false;
      const list = await refreshDocs();
      setSlug(list?.find((d) => d.slug !== slug)?.slug ?? '');
      setStatus({ kind: 'ok', text: tabId === 'pages' ? 'Page deleted. Remove it from the Menu tab if it was there.' : 'Deleted.' });
      loadMeta().catch(() => {});
    } catch (e) {
      fail(e);
    }
  }

  async function publish(data: any) {
    if (!storage) return;
    setStatus({ kind: 'info', text: 'Publishing…' });
    try {
      let path: string, text: string;
      if (tab.type === 'file') {
        path = tab.path;
        text = JSON.stringify({ ...(doc?.original ?? {}), ...data.root.props }, null, 2) + '\n';
      } else {
        path = `${tab.dir}/${slug}.json`;
        text = JSON.stringify(data, null, 2) + '\n';
      }
      const { sha } = await storage.write(path, text, doc?.sha);
      setDoc((d) => ({ ...d, data, sha: sha ?? d?.sha, original: tab.type === 'file' ? JSON.parse(text) : undefined }));
      dirty.current = false;
      refreshDocs()?.catch(() => {});
      if (storage.mode === 'local') loadMeta().catch(() => {});
      setStatus({ kind: 'ok', text: storage.mode === 'local' ? 'Saved. The site preview has updated.' : 'Published. The live site will update in about a minute.' });
    } catch (e) {
      fail(e);
    }
  }

  if (needsLogin) {
    return (
      <div className="hr-editor-gate">
        <h1>Health Renovation – Editor</h1>
        <p>Log in with your GitHub account to edit the website.</p>
        <button type="button" className="hr-editor-btn hr-editor-btn--primary" onClick={login}>Log in with GitHub</button>
        {status && <p className={`hr-editor-status is-${status.kind}`}>{status.text}</p>}
      </div>
    );
  }

  const viewUrl = tab.type === 'collection' ? tab.url(slug) : tab.url;
  const title = doc?.data?.root?.props?.title ?? tab.label;

  return (
    <div className="hr-editor">
      <div className="hr-editor-bar">
        <nav className="hr-editor-tabs" aria-label="What to edit">
          {Object.entries(TABS).map(([id, t]) => (
            <button key={id} type="button" className={id === tabId ? 'is-active' : ''} aria-current={id === tabId ? 'page' : undefined} onClick={() => switchTab(id)}>
              {t.label}
            </button>
          ))}
        </nav>
        <div className="hr-editor-doc">
          {tab.type === 'collection' && (
            <>
              <select className="hr-editor-select" aria-label={`Choose ${tab.singular}`} value={slug} onChange={(e) => switchDoc(e.target.value)}>
                {docs.map((d) => (
                  <option key={d.slug} value={d.slug}>{tab.describe ? tab.describe(d) : d.title}</option>
                ))}
              </select>
              <button type="button" className="hr-editor-btn" onClick={createDoc}>+ New {tab.singular}</button>
              {doc && !tab.undeletable?.includes(slug) && (
                <button type="button" className="hr-editor-btn hr-editor-btn--danger" onClick={deleteDoc}>Delete</button>
              )}
            </>
          )}
          <a className="hr-editor-btn" href={viewUrl} target="_blank" rel="noopener">View on site ↗</a>
        </div>
      </div>
      {status && (
        <div className={`hr-editor-status is-${status.kind}`} role="status">
          {status.text}
          {status.kind !== 'info' && <button type="button" aria-label="Dismiss" onClick={() => setStatus(null)}>×</button>}
        </div>
      )}
      {doc && meta && (
        <div className="hr-editor-canvas">
          <Puck
            key={`${tabId}:${slug}`}
            config={tab.config}
            data={doc.data}
            metadata={{ ...meta, current: slug } as any}
            onPublish={publish}
            onChange={() => (dirty.current = true)}
            headerTitle={title}
            headerPath={tab.type === 'collection' ? viewUrl : undefined}
            viewports={viewports}
            iframe={{ enabled: true, waitForStyles: true }}
            ui={tab.type === 'file' ? { leftSideBarVisible: false } : undefined}
          />
        </div>
      )}
    </div>
  );
}
