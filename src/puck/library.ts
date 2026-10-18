import { useSyncExternalStore } from 'react';
import type { ResolvedImage } from './types';

/** Image library shared between the editor shell and the image picker field. */
type Library = {
  images: Record<string, ResolvedImage>;
  upload: ((file: File) => Promise<string>) | null;
};

let state: Library = { images: {}, upload: null };
const listeners = new Set<() => void>();

export function setLibrary(patch: Partial<Library>) {
  state = { ...state, ...patch, images: { ...state.images, ...(patch.images ?? {}) } };
  listeners.forEach((l) => l());
}

export function useLibrary() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
    () => state
  );
}
