import { get, writable } from 'svelte/store';
import { ApiError, apiRequest, type Mode } from './api';
import { loadSecurityMode, saveSecurityMode, securityMode } from './security-mode';
export interface AuthUser { id: string; name: string; role: 'PATIENT' | 'DOCTOR' | 'ADMIN' }
export const authState = writable<{ user: AuthUser | null; ready: boolean; error: string }>({ user: null, ready: false, error: '' });
let restoring: Promise<void> | undefined;
let identityRevision = 0;
export function clearAuthentication() { identityRevision++; authState.set({ user: null, ready: true, error: '' }); }
export function loginDestination(path: string | null) {
  return path && ['/', '/history', '/consultations', '/settings', '/services'].includes(path) ? path : '/history';
}
// A single identity check on load/navigation, not a polling timer or localStorage identity.
export function restoreAuth(): Promise<void> {
  if (restoring) return restoring;
  const revision = identityRevision;
  restoring = (async () => {
    try {
      const data = await apiRequest<{ user: AuthUser; mode?: Mode }>('/api/demo/auth');
      if (revision !== identityRevision) return;
      authState.set({ user: data.user ?? null, ready: true, error: '' });
      if (data.mode) saveSecurityMode(data.mode);
    } catch (error) {
      if (revision !== identityRevision) return;
      clearAuthentication();
      if (!(error instanceof ApiError && error.status === 401)) authState.update(value => ({ ...value, error: error instanceof Error ? error.message : 'Status akun tidak dapat dimuat.' }));
    }
  })().finally(() => { restoring = undefined; });
  return restoring;
}
async function sessionToken(create = false) {
  try { return (await apiRequest<{ csrfToken: string }>('/api/demo/session')).csrfToken; }
  catch (error) {
    if (!create || !(error instanceof ApiError && error.status === 401)) throw error;
    loadSecurityMode();
    return (await apiRequest<{ csrfToken: string }>('/api/demo/session', { mode: get(securityMode) }, 'json', { 'X-CareProbe-Settings': '1' })).csrfToken;
  }
}
export async function authRequest<T>(path: string, body?: object, responseType: 'json' | 'text' = 'json'): Promise<T> {
  try {
    const headers: Record<string, string> = body ? { 'X-CSRF-Token': await sessionToken() } : {};
    return await apiRequest<T>('/api/demo/auth' + path, body, responseType, headers);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) clearAuthentication();
    throw error;
  }
}
export async function login(account: string, password: string) {
  try {
    const token = await sessionToken(true);
    const data = await apiRequest<{ user: AuthUser }>('/api/demo/auth/login', { account, password }, 'json', { 'X-CSRF-Token': token });
    identityRevision++;
    authState.set({ user: data.user, ready: true, error: '' });
  } catch (error) {
    if (error instanceof ApiError && (error.status === 400 || error.status === 401)) throw new Error('Nama pengguna atau kata sandi tidak cocok.');
    throw error;
  }
}
export async function logout() {
  try { await authRequest('/logout', {}); }
  catch (error) { if (!(error instanceof ApiError && error.status === 401)) throw error; }
  clearAuthentication();
}
