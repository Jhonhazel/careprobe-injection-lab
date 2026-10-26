import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { get } from 'svelte/store';
import Settings from '../routes/settings/+page.svelte';
import { securityMode } from './security-mode';

afterEach(() => { cleanup(); localStorage.clear(); securityMode.set('secure'); });
describe('settings confirmation', () => {
  it('changes to vulnerable only after explicit confirmation and can return to secure', async () => {
    render(Settings);
    await fireEvent.click(screen.getByLabelText('Vulnerable (Rentan — pengujian lokal)'));
    expect(get(securityMode)).toBe('secure');
    await fireEvent.click(screen.getByRole('button', { name: 'Aktifkan mode rentan' }));
    expect(get(securityMode)).toBe('vulnerable');
    expect(screen.getByRole('alert').textContent).toContain('rentan');
    await fireEvent.click(screen.getByLabelText('Secure (Aman)'));
    expect(get(securityMode)).toBe('secure');
  });
  it('can cancel the request to enable vulnerable mode', async () => {
    render(Settings);
    await fireEvent.click(screen.getByLabelText('Vulnerable (Rentan — pengujian lokal)'));
    await fireEvent.click(screen.getByRole('button', { name: 'Batal' }));
    expect(get(securityMode)).toBe('secure');
    expect(screen.queryByRole('button', { name: 'Aktifkan mode rentan' })).toBeNull();
  });
});
