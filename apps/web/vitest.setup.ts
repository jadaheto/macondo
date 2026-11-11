import '@testing-library/jest-dom/vitest';

/**
 * Node ≥ 22 expone un `localStorage` global experimental (undefined sin --localstorage-file) que
 * tapa el de jsdom. Si no funciona, instalamos un Storage en memoria equivalente.
 */
class MemoryStorage implements Storage {
  private m = new Map<string, string>();
  get length() {
    return this.m.size;
  }
  clear() {
    this.m.clear();
  }
  getItem(k: string) {
    return this.m.has(k) ? this.m.get(k)! : null;
  }
  key(i: number) {
    return [...this.m.keys()][i] ?? null;
  }
  removeItem(k: string) {
    this.m.delete(k);
  }
  setItem(k: string, v: string) {
    this.m.set(k, String(v));
  }
}

for (const name of ['localStorage', 'sessionStorage'] as const) {
  let ok = false;
  try {
    const s = globalThis[name];
    s.setItem('__t', '1');
    s.removeItem('__t');
    ok = true;
  } catch {
    ok = false;
  }
  if (!ok) {
    const store = new MemoryStorage();
    Object.defineProperty(globalThis, name, { value: store, configurable: true, writable: true });
    if (typeof window !== 'undefined' && window !== (globalThis as unknown)) {
      Object.defineProperty(window, name, { value: store, configurable: true, writable: true });
    }
  }
}
