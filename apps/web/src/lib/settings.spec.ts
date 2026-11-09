import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { get } from 'svelte/store';
import Settings from '../routes/settings/+page.svelte';
import { securityMode } from './security-mode';
import { authState, clearAuthentication } from './auth';

beforeEach(() => { vi.stubGlobal('fetch', async (url: string, options?: RequestInit) => url === '/api/demo/auth' ? new Response('{}', { status: 401 }) : new Response(JSON.stringify({ mode: options?.body ? JSON.parse(String(options.body)).mode ?? 'secure' : 'secure', csrfToken: 'demo-token', reminder: false }))); });
afterEach(() => { vi.unstubAllGlobals(); cleanup(); localStorage.clear(); securityMode.set('secure'); clearAuthentication(); });
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

it('clears a stale authenticated identity when the reminder session expires',async()=>{
  let expired=false;
  vi.stubGlobal('fetch',async(url:string,options?:RequestInit)=>{
    if(url==='/api/demo/auth')return new Response(JSON.stringify({user:{id:'alya',name:'Alya Demo',role:'PATIENT'}}));
    if(expired && !options?.method)return new Response(JSON.stringify({error:{code:'DEMO_SESSION_REQUIRED',message:'Sesi telah berakhir.'}}),{status:401});
    return new Response(JSON.stringify({mode:'secure',csrfToken:'token',reminder:false}));
  });
  render(Settings);await screen.findByText('Sesi demo aktif (cookie HttpOnly).');
  await waitFor(()=>expect(get(authState).user?.id).toBe('alya'));
  expired=true;await fireEvent.click(screen.getByRole('button',{name:'Aktifkan pengingat'}));
  await screen.findByText('Sesi telah berakhir.');expect(get(authState).user).toBeNull();
});
