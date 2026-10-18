import css from '../../styles/main.css?raw';

export function GET() {
  return new Response(css, { headers: { 'Content-Type': 'text/css; charset=utf-8' } });
}
