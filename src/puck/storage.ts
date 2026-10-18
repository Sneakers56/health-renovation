/**
 * Where the visual editor reads and writes pages.
 * - local:  the Decap dev proxy (`npm run cms`) writes straight to the project files.
 * - github: commits via the GitHub API using the same GitHub login as /admin (Netlify OAuth).
 */
export const PAGES_DIR = 'src/content/pages';
export const IMAGES_DIR = 'src/assets/images';
const LOCAL_API = 'http://localhost:8081/api/v1';

export type PageSummary = { slug: string; title: string };
export type LoadedPage = { data: any; sha?: string };

export interface Storage {
  mode: 'local' | 'github';
  listPages(): Promise<PageSummary[]>;
  loadPage(slug: string): Promise<LoadedPage>;
  savePage(slug: string, data: any, sha?: string): Promise<{ sha?: string }>;
  deletePage(slug: string, sha?: string): Promise<void>;
  uploadImage(name: string, file: File): Promise<void>;
  imageExists(name: string): Promise<boolean>;
}

const pagePath = (slug: string) => `${PAGES_DIR}/${slug}.json`;
const serialise = (data: any) => JSON.stringify(data, null, 2) + '\n';
const slugFromPath = (path: string) => path.split('/').pop()!.replace(/\.json$/, '');

async function fileToBase64(file: Blob): Promise<string> {
  const buf = new Uint8Array(await file.arrayBuffer());
  let binary = '';
  for (let i = 0; i < buf.length; i += 0x8000) binary += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  return btoa(binary);
}
const textToBase64 = (text: string) => fileToBase64(new Blob([text]));
function base64ToText(b64: string) {
  const bin = atob(b64.replace(/\n/g, ''));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

/* ── Local (decap-server) ───────────────────────────────────────────────── */

async function local(action: string, params: Record<string, any>) {
  const res = await fetch(LOCAL_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, params: { branch: 'main', ...params } }),
  });
  if (!res.ok) throw new Error(`Local save server error (${res.status})`);
  return res.json();
}

export async function localAvailable(): Promise<boolean> {
  try {
    const res = await fetch(LOCAL_API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'info' }) });
    return res.ok;
  } catch {
    return false;
  }
}

export const localStorageBackend: Storage = {
  mode: 'local',
  async listPages() {
    const entries: { data: string; file: { path: string } }[] = await local('entriesByFolder', { folder: PAGES_DIR, extension: 'json', depth: 1 });
    return entries.map((e) => ({ slug: slugFromPath(e.file.path), title: JSON.parse(e.data)?.root?.props?.title ?? slugFromPath(e.file.path) }));
  },
  async loadPage(slug) {
    const entry = await local('getEntry', { path: pagePath(slug) });
    return { data: JSON.parse(entry.data) };
  },
  async savePage(slug, data) {
    const file = { slug, path: pagePath(slug), raw: serialise(data) };
    await local('persistEntry', { dataFiles: [file], assets: [], options: { commitMessage: `Update page ${slug}`, useWorkflow: false, status: 'draft' } });
    return {};
  },
  async deletePage(slug) {
    await local('deleteFile', { path: pagePath(slug), options: { commitMessage: `Delete page ${slug}` } });
  },
  async uploadImage(name, file) {
    await local('persistMedia', { asset: { path: `${IMAGES_DIR}/${name}`, content: await fileToBase64(file), encoding: 'base64' }, options: { commitMessage: `Upload ${name}` } });
  },
  async imageExists(name) {
    const res = await fetch(LOCAL_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'getMediaFile', params: { branch: 'main', path: `${IMAGES_DIR}/${name}` } }),
    });
    return res.ok;
  },
};

/* ── GitHub (live site) ─────────────────────────────────────────────────── */

export async function readRepoConfig(): Promise<{ repo: string; branch: string }> {
  const yml = await (await fetch('/admin/config.yml')).text();
  const repo = yml.match(/^\s*repo:\s*([\w.-]+\/[\w.-]+)/m)?.[1];
  const branch = yml.match(/^\s*branch:\s*([\w./-]+)/m)?.[1] ?? 'main';
  if (!repo || repo === 'OWNER/REPO') throw new Error('Set the GitHub repo in public/admin/config.yml before using the editor on the live site.');
  return { repo, branch };
}

/** Reuse the token from /admin if Mark is already logged in there. */
export function existingGithubToken(): string | null {
  try {
    const user = JSON.parse(localStorage.getItem('decap-cms-user') || 'null');
    return user?.backendName === 'github' && user.token ? user.token : null;
  } catch {
    return null;
  }
}

/** Netlify's GitHub OAuth popup – the same flow Decap CMS uses. */
export function loginWithGithub(): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = `https://api.netlify.com/auth?provider=github&site_id=${encodeURIComponent(location.host)}&scope=repo`;
    const popup = window.open(url, 'netlify-auth', 'width=960,height=640');
    if (!popup) return reject(new Error('Please allow pop-ups for this site to log in.'));
    function onMessage(e: MessageEvent) {
      if (e.origin !== 'https://api.netlify.com' || typeof e.data !== 'string') return;
      if (e.data === 'authorizing:github') {
        popup!.postMessage(e.data, e.origin);
        return;
      }
      const m = /^authorization:github:(success|error):(.+)$/.exec(e.data);
      if (!m) return;
      window.removeEventListener('message', onMessage);
      const payload = JSON.parse(m[2]);
      if (m[1] === 'success' && payload.token) {
        localStorage.setItem('decap-cms-user', JSON.stringify({ token: payload.token, backendName: 'github' }));
        resolve(payload.token);
      } else reject(new Error(payload.message || 'GitHub login failed'));
    }
    window.addEventListener('message', onMessage);
  });
}

export function githubStorage(token: string, repo: string, branch: string): Storage {
  async function gh(path: string, init: RequestInit = {}) {
    const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}${init.method ? '' : `?ref=${branch}`}`, {
      ...init,
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', ...(init.headers || {}) },
    });
    if (res.status === 401) throw new Error('Your GitHub login has expired. Please log in again.');
    if (res.status === 409) throw new Error('This page was changed elsewhere. Reload the editor to get the latest version.');
    if (!res.ok && res.status !== 404) throw new Error(`GitHub error ${res.status}`);
    return res;
  }

  return {
    mode: 'github',
    async listPages() {
      const files: { name: string; path: string }[] = await (await gh(PAGES_DIR)).json();
      const json = files.filter((f) => f.name.endsWith('.json'));
      return Promise.all(
        json.map(async (f) => {
          const file = await (await gh(f.path)).json();
          return { slug: slugFromPath(f.path), title: JSON.parse(base64ToText(file.content))?.root?.props?.title ?? slugFromPath(f.path) };
        })
      );
    },
    async loadPage(slug) {
      const res = await gh(pagePath(slug));
      if (res.status === 404) throw new Error(`Page "${slug}" not found`);
      const file = await res.json();
      return { data: JSON.parse(base64ToText(file.content)), sha: file.sha };
    },
    async savePage(slug, data, sha) {
      const res = await gh(pagePath(slug), {
        method: 'PUT',
        body: JSON.stringify({ message: `Update page ${slug}`, content: await textToBase64(serialise(data)), branch, ...(sha ? { sha } : {}) }),
      });
      return { sha: (await res.json()).content?.sha };
    },
    async deletePage(slug, sha) {
      await gh(pagePath(slug), { method: 'DELETE', body: JSON.stringify({ message: `Delete page ${slug}`, sha, branch }) });
    },
    async uploadImage(name, file) {
      await gh(`${IMAGES_DIR}/${name}`, { method: 'PUT', body: JSON.stringify({ message: `Upload ${name}`, content: await fileToBase64(file), branch }) });
    },
    async imageExists(name) {
      return (await gh(`${IMAGES_DIR}/${name}`)).status !== 404;
    },
  };
}
