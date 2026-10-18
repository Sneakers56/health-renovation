/**
 * Where the editor reads and writes files.
 * - local:  `npm run dev` exposes a small save API (scripts/editor-dev-api.mjs) that writes project files.
 * - github: on the live site, commits via the GitHub API using a GitHub login through Netlify.
 */
export const GITHUB_REPO = 'Sneakers56/health-renovation';
export const GITHUB_BRANCH = 'main';
export const IMAGES_DIR = 'src/assets/images';
const TOKEN_KEY = 'hr-editor-github';

export type DocSummary = { slug: string; title: string; props: Record<string, any> };

export interface Storage {
  mode: 'local' | 'github';
  listDocs(dir: string): Promise<DocSummary[]>;
  read(path: string): Promise<{ text: string; sha?: string }>;
  write(path: string, text: string, sha?: string): Promise<{ sha?: string }>;
  remove(path: string, sha?: string): Promise<void>;
  uploadImage(name: string, file: File): Promise<void>;
  imageExists(name: string): Promise<boolean>;
}

const slugFromPath = (p: string) => p.split('/').pop()!.replace(/\.json$/, '');
function summarise(path: string, text: string): DocSummary {
  const props = JSON.parse(text)?.root?.props ?? {};
  return { slug: slugFromPath(path), title: props.title ?? slugFromPath(path), props };
}

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

/* ── Local (dev server) ─────────────────────────────────────────────────── */

async function api(action: string, init: { query?: Record<string, string>; body?: unknown } = {}) {
  const qs = init.query ? `?${new URLSearchParams(init.query)}` : '';
  const res = await fetch(`/__editor/${action}${qs}`, {
    method: init.body ? 'POST' : 'GET',
    headers: { 'X-HR-Editor': '1', ...(init.body ? { 'Content-Type': 'application/json' } : {}) },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Save server error (${res.status})`);
  return json;
}

export async function localAvailable(): Promise<boolean> {
  try {
    await api('ping');
    return true;
  } catch {
    return false;
  }
}

export const localStorageBackend: Storage = {
  mode: 'local',
  async listDocs(dir) {
    const files: { path: string; content: string }[] = await api('list', { query: { dir } });
    return files.map((f) => summarise(f.path, f.content));
  },
  async read(path) {
    return { text: (await api('read', { query: { path } })).content };
  },
  async write(path, text) {
    await api('write', { body: { path, content: text } });
    return {};
  },
  async remove(path) {
    await api('delete', { body: { path } });
  },
  async uploadImage(name, file) {
    await api('write', { body: { path: `${IMAGES_DIR}/${name}`, content: await fileToBase64(file), encoding: 'base64' } });
  },
  async imageExists(name) {
    return (await api('exists', { query: { path: `${IMAGES_DIR}/${name}` } })).exists;
  },
};

/* ── GitHub (live site) ─────────────────────────────────────────────────── */

export function existingGithubToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function forgetGithubToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

/** Netlify's GitHub OAuth popup (Project configuration → Access & security → OAuth). */
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
        localStorage.setItem(TOKEN_KEY, payload.token);
        resolve(payload.token);
      } else reject(new Error(payload.message || 'GitHub login failed'));
    }
    window.addEventListener('message', onMessage);
  });
}

export class AuthError extends Error {}

export function githubStorage(token: string): Storage {
  async function gh(path: string, init: RequestInit = {}) {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${path}${init.method ? '' : `?ref=${GITHUB_BRANCH}`}`, {
      ...init,
      cache: 'no-store',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', ...(init.headers || {}) },
    });
    if (res.status === 401) throw new AuthError('Your GitHub login has expired. Please log in again.');
    if (res.status === 409) throw new Error('This was changed elsewhere since you opened it. Reload the editor to get the latest version.');
    if (!res.ok && res.status !== 404) throw new Error(`GitHub error ${res.status}`);
    return res;
  }
  const put = async (path: string, content: string, message: string, sha?: string) =>
    (await gh(path, { method: 'PUT', body: JSON.stringify({ message, content, branch: GITHUB_BRANCH, ...(sha ? { sha } : {}) }) })).json();

  return {
    mode: 'github',
    async listDocs(dir) {
      const res = await gh(dir);
      if (res.status === 404) return [];
      const files: { name: string; path: string }[] = await res.json();
      return Promise.all(
        files.filter((f) => f.name.endsWith('.json')).map(async (f) => summarise(f.path, base64ToText((await (await gh(f.path)).json()).content)))
      );
    },
    async read(path) {
      const res = await gh(path);
      if (res.status === 404) throw new Error(`${path} not found`);
      const file = await res.json();
      return { text: base64ToText(file.content), sha: file.sha };
    },
    async write(path, text, sha) {
      const out = await put(path, await textToBase64(text), `Update ${slugFromPath(path)}`, sha);
      return { sha: out.content?.sha };
    },
    async remove(path, sha) {
      await gh(path, { method: 'DELETE', body: JSON.stringify({ message: `Delete ${slugFromPath(path)}`, sha, branch: GITHUB_BRANCH }) });
    },
    async uploadImage(name, file) {
      await put(`${IMAGES_DIR}/${name}`, await fileToBase64(file), `Upload ${name}`);
    },
    async imageExists(name) {
      return (await gh(`${IMAGES_DIR}/${name}`)).status !== 404;
    },
  };
}
