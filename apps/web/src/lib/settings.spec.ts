import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { get } from 'svelte/store';
import Settings from '../routes/settings/+page.svelte';
import { securityMode } from './security-mode';

beforeEach(() => { vi.stubGlobal('fetch', async (_url: string, options?: RequestInit) => new Response(JSON.stringify({ mode: options?.body ? JSON.parse(String(options.body)).mode ?? 'secure' : 'secure', csrfToken: 'demo-token', reminder: false }))); });
afterEach(() => { vi.unstubAllGlobals(); cleanup(); localStorage.clear(); securityMode.set('secure'); });
describe('settings confirmation', () => {
  it('changes to vulnerable only after explicit confirmation and can return to secure', async () => {
    render(Settings);
    await screen.findByText('Sesi demo aktif (cookie HttpOnly).');
    await fireEvent.click(screen.getByLabelText('Vulnerable (Rentan — pengujian lokal)'));
    expect(get(securityMode)).toBe('secure');
    await fireEvent.click(screen.getByRole('button', { name: 'Aktifkan mode rentan' }));
    await waitFor(() => expect(get(securityMode)).toBe('vulnerable'));
    expect(screen.getByRole('alert').textContent).toContain('rentan');
    await fireEvent.click(screen.getByLabelText('Secure (Aman)'));
    await waitFor(() => expect(get(securityMode)).toBe('secure'));
  });
  it('can cancel the request to enable vulnerable mode', async () => {
    render(Settings);
    await screen.findByText('Sesi demo aktif (cookie HttpOnly).');
    await fireEvent.click(screen.getByLabelText('Vulnerable (Rentan — pengujian lokal)'));
    await fireEvent.click(screen.getByRole('button', { name: 'Batal' }));
    expect(get(securityMode)).toBe('secure');
    expect(screen.queryByRole('button', { name: 'Aktifkan mode rentan' })).toBeNull();
  });
});
