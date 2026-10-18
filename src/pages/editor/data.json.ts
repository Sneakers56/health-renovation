import { buildSiteMeta } from '../../lib/siteMeta';

export async function GET() {
  const meta = await buildSiteMeta({ forEditor: true });
  return new Response(JSON.stringify(meta), { headers: { 'Content-Type': 'application/json' } });
}
