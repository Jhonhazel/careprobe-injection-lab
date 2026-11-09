import { afterEach, it, expect, vi } from 'vitest';
import { createRawSnippet } from 'svelte';
import { cleanup, render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import AuthGate from './AuthGate.svelte';
import { authState, clearAuthentication } from '../auth';
const {goto}=vi.hoisted(()=>({goto:vi.fn()}));
vi.mock('$app/navigation',()=>({goto}));
afterEach(()=>{cleanup();clearAuthentication();vi.unstubAllGlobals();goto.mockClear();});
const children=createRawSnippet(()=>({render:()=>'<p>Protected record</p>'}));
it('does not mount protected content until the backend identity check completes',async()=>{
  let finish!:(r:Response)=>void;
  vi.stubGlobal('fetch',()=>new Promise<Response>(resolve=>{finish=resolve;}));
  render(AuthGate,{path:'/history',children});
  expect(screen.queryByText('Protected record')).toBeNull();
  await waitFor(()=>expect(finish).toBeDefined());
  finish(new Response(JSON.stringify({user:{id:'alya',name:'Alya',role:'PATIENT'}})));
  await screen.findByText('Protected record');
});
it.each(['/services','/consultations','/history','/settings'])('redirects anonymous %s to its safe login destination',async path=>{
  vi.stubGlobal('fetch',async()=>new Response('{}',{status:401}));
  render(AuthGate,{path,children});
  await waitFor(()=>expect(goto).toHaveBeenCalledWith('/login?next='+encodeURIComponent(path),{replaceState:true}));
  expect(screen.queryByText('Protected record')).toBeNull();
});
it('shows a retryable connection error rather than mounting private data or redirecting',async()=>{
  vi.stubGlobal('fetch',async()=>{throw Error('offline');});
  render(AuthGate,{path:'/history',children});
  await screen.findByRole('button',{name:'Coba lagi'});
  expect(screen.queryByText('Protected record')).toBeNull();expect(goto).not.toHaveBeenCalled();
  vi.stubGlobal('fetch',async()=>new Response(JSON.stringify({user:{id:'alya',name:'Alya',role:'PATIENT'}})));
  await fireEvent.click(screen.getByRole('button',{name:'Coba lagi'}));
  await screen.findByText('Protected record');
});
it('clears protected content immediately when authentication expires',async()=>{
  vi.stubGlobal('fetch',async()=>new Response(JSON.stringify({user:{id:'alya',name:'Alya',role:'PATIENT'}})));
  render(AuthGate,{path:'/history',children});
  await screen.findByText('Protected record');clearAuthentication();
  await waitFor(()=>expect(screen.queryByText('Protected record')).toBeNull());
  expect(authState).toBeTruthy();
});
it('keeps an unsent draft mounted during same-path focus revalidation',async()=>{
  let finish!:(r:Response)=>void;let checks=0;
  vi.stubGlobal('fetch',()=>++checks===1 ? Promise.resolve(new Response(JSON.stringify({user:{id:'alya',name:'Alya',role:'PATIENT'}}))) : new Promise<Response>(resolve=>{finish=resolve;}));
  const draft=createRawSnippet(()=>({render:()=>'<div><input aria-label="Draft reason" /></div>'}));
  render(AuthGate,{path:'/consultations',children:draft});
  const field=await screen.findByLabelText('Draft reason');
  await fireEvent.input(field,{target:{value:'Draf konsultasi belum dikirim'}});
  await fireEvent(window,new Event('focus'));
  expect(screen.getByLabelText('Draft reason')).toBe(field);
  finish(new Response(JSON.stringify({user:{id:'alya',name:'Alya',role:'PATIENT'}})));
  await waitFor(()=>expect((screen.getByLabelText('Draft reason') as HTMLInputElement).value).toBe('Draf konsultasi belum dikirim'));
});
