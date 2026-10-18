import { useCallback, useEffect, useRef, useState } from 'react';
import { Puck } from '@puckeditor/core';
import '@puckeditor/core/puck.css';
import './editor.css';
import { config } from './config';
import { setLibrary } from './library';
import type { SiteMeta } from './types';
import {
  type Storage,
  type PageSummary,
  localAvailable,
  localStorageBackend,
  readRepoConfig,
  existingGithubToken,
  loginWithGithub,
  githubStorage,
} from './storage';

const RESERVED = ['services', 'blog', 'thanks', 'admin', 'editor', '404', 'rss.xml'];
const viewports = [
  { width: 375, label: 'Phone', icon: 'Smartphone' as const },
  { width: 768, label: 'Tablet', icon: 'Tablet' as const },
  { width: 1280, label: 'Desktop', icon: 'Monitor' as const },
];

const slugify = (s: string) =>
  s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const pageUrl = (slug: string) => (slug === 'home' ? '/' : `/${slug}/`);

function newPageData(title: string) {
  const id = () => crypto.randomUUID();
  return {
    root: { props: { title, seoTitle: '', seoDescription: '', noindex: false } },
    content: [
      { type: 'Banner', props: { id: `Banner-${id()}`, eyebrow: '', heading: title, subtitle: '', colour: 'teal', hidden: false } },
      { type: 'TextSection', props: { id: `TextSection-${id()}`, eyebrow: '', heading: '', body: '<p>Start writing here, or drag blocks in from the left.</p>', align: 'left', background: 'white', hidden: false } },
    ],
  };
}

type Status = { kind: 'info' | 'ok' | 'error'; text: string } | null;

export default function Editor() {
  const [storage, setStorage] = useState<Storage | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [meta, setMeta] = useState<SiteMeta | null>(null);
  const [pages, setPages] = useState<PageSummary[]>([]);
  const [slug, setSlug] = useState(() => new URLSearchParams(location.search).get('page') || 'home');
  const [page, setPage] = useState<{ data: any; sha?: string } | null>(null);
  const [status, setStatus] = useState<Status>({ kind: 'info', text: 'Loading…' });
  const dirty = useRef(false);
  const repoRef = useRef<{ repo: string; branch: string } | null>(null);

  // Site data (services, images, etc.) for the blocks
  useEffect(() => {
    fetch('/editor/data.json').then((r) => r.json()).then(setMeta).catch(() => setStatus({ kind: 'error', text: 'Could not load site data.' }));
  }, []);

  // Pick where to save: local files when developing, GitHub on the live site
  useEffect(() => {
    (async () => {
      if (['localhost', '127.0.0.1'].includes(location.hostname)) {
        if (await localAvailable()) return setStorage(localStorageBackend);
        return setStatus({ kind: 'error', text: 'Start the local save server with `npm run cms`, then reload.' });
      }
      try {
        repoRef.current = await readRepoConfig();
      } catch (e) {
        return setStatus({ kind: 'error', text: (e as Error).message });
      }
      const token = existingGithubToken();
      if (token) setStorage(githubStorage(token, repoRef.current.repo, repoRef.current.branch));
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
      setStorage(githubStorage(token, repoRef.current!.repo, repoRef.current!.branch));
    } catch (e) {
      setStatus({ kind: 'error', text: (e as Error).message });
    }
  }

  // Image uploads go to src/assets/images through the active storage
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
        setLibrary({ images: { [name]: { src: URL.createObjectURL(file) } } });
        setMeta((m) => (m ? { ...m, images: { ...m.images, [name]: { src: URL.createObjectURL(file) } } } : m));
        return name;
      },
    });
  }, [storage]);

  useEffect(() => {
    if (meta) setLibrary({ images: meta.images });
  }, [meta]);

  const refreshPages = useCallback(async () => {
    if (!storage) return;
    const list = await storage.listPages();
    list.sort((a, b) => (a.slug === 'home' ? -1 : b.slug === 'home' ? 1 : a.title.localeCompare(b.title)));
    setPages(list);
  }, [storage]);

  useEffect(() => {
    refreshPages().catch((e) => setStatus({ kind: 'error', text: e.message }));
  }, [refreshPages]);

  // Load the selected page
  useEffect(() => {
    if (!storage) return;
    setPage(null);
    setStatus({ kind: 'info', text: 'Loading page…' });
    storage
      .loadPage(slug)
      .then((p) => {
        setPage(p);
        setStatus(null);
        dirty.current = false;
        history.replaceState(null, '', `?page=${slug}`);
      })
      .catch((e) => setStatus({ kind: 'error', text: e.message }));
  }, [storage, slug]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty.current) e.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);

  const confirmLeave = () => !dirty.current || confirm('You have unpublished changes. Discard them?');

  function switchPage(next: string) {
    if (next !== slug && confirmLeave()) setSlug(next);
  }

  async function createPage() {
    if (!storage || !confirmLeave()) return;
    const title = prompt('Name of the new page (e.g. Pricing):')?.trim();
    if (!title) return;
    const newSlug = slugify(title);
    if (!newSlug || RESERVED.includes(newSlug) || pages.some((p) => p.slug === newSlug)) {
      return alert(`A page at /${newSlug}/ already exists or that address is reserved. Try another name.`);
    }
    setStatus({ kind: 'info', text: 'Creating page…' });
    try {
      await storage.savePage(newSlug, newPageData(title));
      await refreshPages();
      setSlug(newSlug);
      setStatus({ kind: 'ok', text: `Created /${newSlug}/. Add it to the menu in /admin → Settings → Navigation.` });
    } catch (e) {
      setStatus({ kind: 'error', text: (e as Error).message });
    }
  }

  async function deletePage() {
    if (!storage || !page || slug === 'home') return;
    if (!confirm(`Delete the page "${page.data.root?.props?.title}" (${pageUrl(slug)})? This can't be undone here.`)) return;
    try {
      await storage.deletePage(slug, page.sha);
      dirty.current = false;
      await refreshPages();
      setSlug('home');
      setStatus({ kind: 'ok', text: 'Page deleted. Remember to remove it from the menu if it was there.' });
    } catch (e) {
      setStatus({ kind: 'error', text: (e as Error).message });
    }
  }

  async function publish(data: any) {
    if (!storage) return;
    setStatus({ kind: 'info', text: 'Publishing…' });
    try {
      const { sha } = await storage.savePage(slug, data, page?.sha);
      setPage({ data, sha: sha ?? page?.sha });
      dirty.current = false;
      await refreshPages();
      setStatus({
        kind: 'ok',
        text: storage.mode === 'local' ? 'Saved. The site preview has updated.' : 'Published. The live site will update in about a minute.',
      });
    } catch (e) {
      setStatus({ kind: 'error', text: (e as Error).message });
    }
  }

  if (needsLogin) {
    return (
      <div className="hr-editor-gate">
        <h1>Health Renovation – Page editor</h1>
        <p>Log in with the same GitHub account you use for the content editor.</p>
        <button type="button" className="hr-editor-btn hr-editor-btn--primary" onClick={login}>Log in with GitHub</button>
        {status && <p className={`hr-editor-status is-${status.kind}`}>{status.text}</p>}
      </div>
    );
  }

  return (
    <div className="hr-editor">
      {status && (
        <div className={`hr-editor-status is-${status.kind}`} role="status">
          {status.text}
          {status.kind !== 'info' && <button type="button" aria-label="Dismiss" onClick={() => setStatus(null)}>×</button>}
        </div>
      )}
      {page && meta ? (
        <Puck
          key={slug}
          config={config as any}
          data={page.data}
          metadata={meta as any}
          onPublish={publish}
          onChange={() => (dirty.current = true)}
          headerTitle={page.data.root?.props?.title}
          headerPath={pageUrl(slug)}
          viewports={viewports}
          iframe={{ enabled: true, waitForStyles: true }}
          overrides={{
            headerActions: ({ children }) => (
              <>
                <select className="hr-editor-select" aria-label="Choose page" value={slug} onChange={(e) => switchPage(e.target.value)}>
                  {pages.map((p) => (
                    <option key={p.slug} value={p.slug}>{p.title} ({pageUrl(p.slug)})</option>
                  ))}
                </select>
                <button type="button" className="hr-editor-btn" onClick={createPage}>+ New page</button>
                {slug !== 'home' && <button type="button" className="hr-editor-btn hr-editor-btn--danger" onClick={deletePage}>Delete</button>}
                <a className="hr-editor-btn" href={pageUrl(slug)} target="_blank" rel="noopener">View page ↗</a>
                <a className="hr-editor-btn" href="/admin/" target="_blank" rel="noopener">Menu &amp; settings ↗</a>
                {children}
              </>
            ),
          }}
        />
      ) : (
        !status && <div className="hr-editor-gate"><p>Loading…</p></div>
      )}
    </div>
  );
}
