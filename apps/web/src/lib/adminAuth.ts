import type { LoginResponse } from '@macondo/shared';
import { readJSON, writeJSON, removeKey } from './storage';

/**
 * Sesión administrativa: token en memoria + sessionStorage (se borra al cerrar la pestaña).
 * NUNCA en localStorage.
 */
const KEY = 'macondo.admin.session';
let memory: LoginResponse | null = null;

export function getSession(): LoginResponse | null {
  if (memory) return memory;
  const s = readJSON<LoginResponse | null>(KEY, null, 'session');
  if (s && typeof s.accessToken === 'string' && s.user) memory = s;
  return memory;
}
export function setSession(s: LoginResponse) {
  memory = s;
  writeJSON(KEY, s, 'session');
}
export function clearSession() {
  memory = null;
  removeKey(KEY, 'session');
}
