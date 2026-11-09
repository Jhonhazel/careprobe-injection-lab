import { beforeEach, afterEach, it, expect, vi } from 'vitest';
import { get } from 'svelte/store';
import { authState, clearAuthentication, login, logout, restoreAuth, loginDestination } from './auth';
beforeEach(clearAuthentication);
afterEach(()=>{vi.unstubAllGlobals();localStorage.clear();});
it('uses the existing bootstrap and credential endpoints, never a frontend role', async()=>{
  const calls: {url:string;body?:string;headers?:HeadersInit}[]=[];
  vi.stubGlobal('fetch',async(url:string,options?:RequestInit)=>{
    calls.push({url,body:options?.body as string,headers:options?.headers});
    if(url==='/api/demo/session' && !options?.method)return new Response(JSON.stringify({error:{code:'DEMO_SESSION_REQUIRED'}}),{status:401});
    if(url==='/api/demo/session')return new Response(JSON.stringify({csrfToken:'anonymous-token'}));
    return new Response(JSON.stringify({user:{id:'alya',name:'Alya Demo',role:'PATIENT'},csrfToken:'rotated-token'}));
  });
  await login('alya','fictional-test-password');
  expect(get(authState).user?.name).toBe('Alya Demo');
  const sent=calls.find(c=>c.url.endsWith('/login'))!;
  expect(JSON.parse(sent.body!)).toEqual({account:'alya',password:'fictional-test-password'});
  expect(sent.headers).toMatchObject({'X-CSRF-Token':'anonymous-token'});
});
it('restores backend identity and clears it on expired session',async()=>{
  vi.stubGlobal('fetch',async()=>new Response(JSON.stringify({user:{id:'raka',name:'Raka Demo',role:'DOCTOR'}})));
  await restoreAuth();expect(get(authState).user?.role).toBe('DOCTOR');
  vi.stubGlobal('fetch',async()=>new Response(JSON.stringify({error:{code:'LOGIN_REQUIRED'}}),{status:401}));
  localStorage.setItem('user', JSON.stringify({id:'admin',role:'ADMIN'}));
  await restoreAuth();expect(get(authState).user).toBeNull();
});
it('uses a fresh session token for logout and keeps identity if logout fails',async()=>{
  authState.set({user:{id:'alya',name:'Alya Demo',role:'PATIENT'},ready:true,error:''});
  let fail=true;
  vi.stubGlobal('fetch',async(url:string,options?:RequestInit)=>{
    if(url==='/api/demo/session')return new Response(JSON.stringify({csrfToken:'current-token'}));
    expect(options?.headers).toMatchObject({'X-CSRF-Token':'current-token'});
    if(fail)throw new Error('offline');
    return new Response(JSON.stringify({user:null,csrfToken:'new-anonymous-token'}));
  });
  await expect(logout()).rejects.toThrow();expect(get(authState).user?.id).toBe('alya');
  fail=false;await logout();expect(get(authState).user).toBeNull();
});
it('reports generic credentials and a distinct connection failure',async()=>{
  vi.stubGlobal('fetch',async(url:string)=>new Response(JSON.stringify(url==='/api/demo/session'?{csrfToken:'token'}:{error:{code:'INVALID_CREDENTIALS'}}),{status:url==='/api/demo/session'?200:401}));
  await expect(login('unknown','wrong')).rejects.toThrow('Nama pengguna atau kata sandi tidak cocok.');
  vi.stubGlobal('fetch',async()=>{throw new Error('offline');});
  await expect(login('alya','wrong')).rejects.toThrow('API tidak dapat dihubungi');
});
it.each(['https://example.com','//example.com','/login','/history?next=https://example.com','/\\example.com'])('rejects unsafe return destination %s',path=>expect(loginDestination(path)).toBe('/history'));
it('accepts a known internal return destination',()=>expect(loginDestination('/settings')).toBe('/settings'));
it('does not restore a stale in-flight identity after logout clears the session',async()=>{
  let finish!:(r:Response)=>void;
  vi.stubGlobal('fetch',()=>new Promise<Response>(resolve=>{finish=resolve;}));
  const pending=restoreAuth();
  clearAuthentication();
  finish(new Response(JSON.stringify({user:{id:'alya',name:'Alya',role:'PATIENT'}})));
  await pending;
  expect(get(authState).user).toBeNull();
});
