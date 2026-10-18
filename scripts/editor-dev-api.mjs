// Local save API for the visual editor, available only while `npm run dev` is running.
// On the live site the editor saves to GitHub instead.
import fs from 'node:fs/promises';
import path from 'node:path';

const ALLOWED_DIRS = ['src/content/pages', 'src/content/services', 'src/content/posts', 'src/data', 'src/assets/images'];
const ALLOWED_EXT = new Set(['.json', '.jpg', '.jpeg', '.png', '.webp']);
const MAX_BODY = 12 * 1024 * 1024;

function resolveSafe(root, rel) {
  if (typeof rel !== 'string' || !rel || rel.includes('\0')) throw new Error('Bad path');
  const abs = path.resolve(root, rel);
  const relNorm = path.relative(root, abs).split(path.sep).join('/');
  if (relNorm.startsWith('..') || path.isAbsolute(relNorm)) throw new Error('Path outside project');
  const dir = ALLOWED_DIRS.find((d) => relNorm === d || relNorm.startsWith(d + '/'));
  if (!dir) throw new Error('Path not editable');
  return { abs, rel: relNorm, isDir: relNorm === dir };
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) reject(new Error('Too large'));
      else chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

export function editorDevApi() {
  return {
    name: 'hr-editor-dev-api',
    configureServer(server) {
      const root = server.config.root;
      server.middlewares.use('/__editor', async (req, res) => {
        const send = (status, body) => {
          res.statusCode = status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(body));
        };
        try {
          // Custom header forces a CORS preflight, so other websites can't call this API.
          if (req.headers['x-hr-editor'] !== '1') return send(403, { error: 'Forbidden' });
          const url = new URL(req.url, 'http://localhost');
          const action = url.pathname.replace(/^\//, '');

          if (action === 'ping') return send(200, { ok: true });

          if (action === 'list' && req.method === 'GET') {
            const { abs, rel, isDir } = resolveSafe(root, url.searchParams.get('dir'));
            if (!isDir) throw new Error('Not a folder');
            const names = (await fs.readdir(abs)).filter((n) => n.endsWith('.json'));
            const files = await Promise.all(names.map(async (name) => ({ name, path: `${rel}/${name}`, content: await fs.readFile(path.join(abs, name), 'utf8') })));
            return send(200, files);
          }

          if (action === 'read' && req.method === 'GET') {
            const { abs } = resolveSafe(root, url.searchParams.get('path'));
            return send(200, { content: await fs.readFile(abs, 'utf8') });
          }

          if (action === 'exists' && req.method === 'GET') {
            const { abs } = resolveSafe(root, url.searchParams.get('path'));
            return send(200, { exists: await fs.access(abs).then(() => true, () => false) });
          }

          if (action === 'write' && req.method === 'POST') {
            const { path: rel, content, encoding = 'utf8' } = JSON.parse(await readBody(req));
            const { abs, isDir } = resolveSafe(root, rel);
            if (isDir || !ALLOWED_EXT.has(path.extname(abs).toLowerCase())) throw new Error('File type not allowed');
            if (path.extname(abs) === '.json') JSON.parse(content);
            await fs.writeFile(abs, encoding === 'base64' ? Buffer.from(content, 'base64') : content);
            return send(200, { ok: true });
          }

          if (action === 'delete' && req.method === 'POST') {
            const { path: rel } = JSON.parse(await readBody(req));
            const { abs, isDir } = resolveSafe(root, rel);
            if (isDir || path.extname(abs) !== '.json') throw new Error('Only pages, services and posts can be deleted');
            await fs.unlink(abs);
            return send(200, { ok: true });
          }

          send(404, { error: 'Unknown action' });
        } catch (err) {
          send(400, { error: err instanceof Error ? err.message : 'Error' });
        }
      });
    },
  };
}
