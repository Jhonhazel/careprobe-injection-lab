import { afterEach, it, expect, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { authState, clearAuthentication } from '../auth';
import AuthControls from './AuthControls.svelte';
const { goto } = vi.hoisted(()=>({goto:vi.fn()}));
vi.mock('$app/navigation',()=>({goto}));
afterEach(()=>{cleanup();vi.unstubAllGlobals();clearAuthentication();goto.mockClear();});
it('restores the backend display name and role in the header then logs out',async()=>{
  authState.set({user:null,ready:false,error:''});
  vi.stubGlobal('fetch',async(url:string)=>new Response(JSON.stringify(url==='/api/demo/auth'?{user:{id:'alya',name:'Alya Demo',role:'PATIENT'}}:url==='/api/demo/session'?{csrfToken:'fresh-token'}:{user:null})));
  render(AuthControls);
  await screen.findByText('Alya Demo');expect(screen.getByText('Pasien')).toBeTruthy();
  await fireEvent.click(screen.getByRole('button',{name:'Keluar'}));
  await screen.findByRole('link',{name:'Masuk'});expect(goto).toHaveBeenCalledWith('/login');
});
it('does not claim logout when the backend is unreachable',async()=>{
  vi.stubGlobal('fetch',async(url:string)=>{
    if(url==='/api/demo/auth')return new Response(JSON.stringify({user:{id:'raka',name:'Raka Demo',role:'DOCTOR'}}));
    throw new Error('offline');
  });
  render(AuthControls);await screen.findByText('Raka Demo');
  await fireEvent.click(screen.getByRole('button',{name:'Keluar'}));
  expect((await screen.findByRole('alert')).textContent).toContain('API tidak dapat dihubungi');
  expect(screen.getByText('Raka Demo')).toBeTruthy();expect(goto).not.toHaveBeenCalled();
});
