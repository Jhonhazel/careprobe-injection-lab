import { writable } from 'svelte/store';
import type { Mode } from './api';

export const securityMode = writable<Mode>('secure');
const key = 'careprobe-security-mode';

export function loadSecurityMode() {
  if (typeof window === 'undefined') return;
  try {
    securityMode.set(localStorage.getItem(key) === 'vulnerable' ? 'vulnerable' : 'secure');
  } catch {
    securityMode.set('secure');
  }
}

export function saveSecurityMode(mode: Mode) {
  securityMode.set(mode);
  try { localStorage.setItem(key, mode); }
  catch { /* If storage is blocked, the next feature load defaults to secure. */ }
}
