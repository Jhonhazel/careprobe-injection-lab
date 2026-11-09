import { afterEach, it, expect, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import Login from '../routes/login/+page.svelte';
import { clearAuthentication } from './auth';
const { goto } = vi.hoisted(()=>({goto:vi.fn()}));
vi.mock('$app/navigation',()=>({goto}));
afterEach(()=>{cleanup();vi.unstubAllGlobals();clearAuthentication();goto.mockClear();window.history.replaceState(null,'','/');});
it('submits real credentials once and navigates only to a validated destination',async()=>{
  window.history.replaceState(null,'','/login?next=//outside.example');
  const submissions: object[]=[];
  vi.stubGlobal('fetch',async(url:string,options?:RequestInit)=>{
    if(url==='/api/demo/auth')return new Response(JSON.stringify({error:{code:'LOGIN_REQUIRED'}}),{status:401});
    if(url==='/api/demo/session')return new Response(JSON.stringify({csrfToken:'token'}));
    submissions.push(JSON.parse(String(options?.body)));
    return new Response(JSON.stringify({user:{id:'alya',name:'Alya Demo',role:'PATIENT'}}));
  });
  render(Login);
  await waitFor(()=>expect((screen.getByRole('button',{name:'Masuk'}) as HTMLButtonElement).disabled).toBe(false));
  await fireEvent.input(screen.getByLabelText('Nama pengguna'),{target:{value:'alya'}});
  await fireEvent.input(screen.getByLabelText('Kata sandi'),{target:{value:'fictional-password'}});
  await fireEvent.click(screen.getByRole('button',{name:'Masuk'}));
  await waitFor(()=>expect(goto).toHaveBeenCalledWith('/history',{replaceState:true}));
  expect(submissions).toEqual([{account:'alya',password:'fictional-password'}]);
  expect((screen.getByLabelText('Kata sandi') as HTMLInputElement).value).toBe('');
});
it('redirects an already authenticated visitor using backend identity',async()=>{
  vi.stubGlobal('fetch',async()=>new Response(JSON.stringify({user:{id:'admin',name:'Admin Demo',role:'ADMIN'}})));
  render(Login);await waitFor(()=>expect(goto).toHaveBeenCalledWith('/history',{replaceState:true}));
});
it('shows a connection error when the API cannot be reached',async()=>{
  vi.stubGlobal('fetch',async()=>{throw new Error('offline');});
  render(Login);expect((await screen.findByRole('alert')).textContent).toContain('API tidak dapat dihubungi');
});
it('prevents duplicate submissions while login is pending',async()=>{
  let finish!: (response:Response)=>void;
  let count=0;
  vi.stubGlobal('fetch',async(url:string)=>{
    if(url==='/api/demo/auth')return new Response('{}',{status:401});
    if(url==='/api/demo/session')return new Response(JSON.stringify({csrfToken:'token'}));
    count++;return new Promise<Response>(resolve=>{finish=resolve;});
  });
  render(Login);await waitFor(()=>expect((screen.getByRole('button',{name:'Masuk'}) as HTMLButtonElement).disabled).toBe(false));
  await fireEvent.input(screen.getByLabelText('Nama pengguna'),{target:{value:'alya'}});
  await fireEvent.input(screen.getByLabelText('Kata sandi'),{target:{value:'dummy-password'}});
  await fireEvent.click(screen.getByRole('button',{name:'Masuk'}));
  const pending=await screen.findByRole('button',{name:'Sedang masuk…'});
  expect((pending as HTMLButtonElement).disabled).toBe(true);
  await fireEvent.click(pending);expect(count).toBe(1);
  finish(new Response(JSON.stringify({user:{id:'alya',name:'Alya Demo',role:'PATIENT'}})));
  await waitFor(()=>expect(goto).toHaveBeenCalled());
});
it('requires both fields and does not send empty credentials',async()=>{
  const sent: string[]=[];
  vi.stubGlobal('fetch',async(url:string)=>{sent.push(url);return new Response('{}',{status:401});});
  const {container}=render(Login);
  await waitFor(()=>expect((screen.getByRole('button',{name:'Masuk'}) as HTMLButtonElement).disabled).toBe(false));
  expect((screen.getByLabelText('Nama pengguna') as HTMLInputElement).checkValidity()).toBe(false);
  expect((screen.getByLabelText('Kata sandi') as HTMLInputElement).checkValidity()).toBe(false);
  await fireEvent.submit(container.querySelector('form')!);
  await screen.findByText('Isi nama pengguna dan kata sandi.');
  expect(sent.some(path=>path.endsWith('/login'))).toBe(false);
});
