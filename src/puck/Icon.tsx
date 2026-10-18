import { icons } from '../lib/icons';

export function Icon({ name, size = 24 }: { name?: string; size?: number }) {
  const d = name ? icons[name] : undefined;
  if (!d) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export const iconOptions = Object.keys(icons).map((value) => ({ label: value, value }));
