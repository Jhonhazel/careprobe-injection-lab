import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import AuthorizationPanel from './AuthorizationPanel.svelte';
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
describe('authorization product controls', () => {
  it.each(['PATIENT','DOCTOR','ADMIN'] as const)('shows only relevant %s controls and escapes fixture content', async role => {
    const calls: {url:string;options?:RequestInit}[]=[];
    vi.stubGlobal('fetch',async(url:string,options?:RequestInit)=> {
      calls.push({url,options});
      let body:object={};
      if(url==='/api/demo/session') body={csrfToken:'session-token'};
      if(url==='/api/demo/auth') body={user:{id:role==='DOCTOR'?'raka':'alya',name:'Akun Demo',role}};
      if(url.endsWith('/consultations')) body={consultations:[{id:1001,ownerPatientId:'alya',assignedDoctorId:'raka',status:'PENDING',reason:'<img src=x onerror=alert(1)>'}]};
      if(url.endsWith('/accounts')) body={users:[{id:'raka',name:'Raka Demo',role:'DOCTOR'}]};
      if(url.endsWith('/audit')) body={decisions:[]};
      if(url.endsWith('/privilege')) body={target:{id:'raka',name:'Raka Demo',role:'DOCTOR',baseRole:'DOCTOR'},durationMinutes:5,grant:null};
      return new Response(JSON.stringify(body));
    });
    const {container}=render(AuthorizationPanel);
    await screen.findByText(/Masuk sebagai/);
    if(role==='ADMIN') {
      await screen.findByRole('button',{name:'Cabut peran dokter Raka'});
      expect(screen.queryByText('Konsultasi fixture #1001')).toBeNull();
    } else {
      await screen.findByRole('heading',{name:'Konsultasi fixture #1001'});
      expect(container.querySelector('img')).toBeNull();
      expect(!!screen.queryByRole('button',{name:'Mulai review #1001'})).toBe(role==='DOCTOR');
      expect(screen.queryByRole('button',{name:'Cabut peran dokter Raka'})).toBeNull();
      if(role==='DOCTOR') {
        await fireEvent.click(screen.getByRole('button',{name:'Mulai review #1001'}));
        await screen.findByText('Perubahan tersimpan pada fixture otorisasi.');
        const sent=calls.find(c=>c.url.endsWith('/transition'))!;
        expect(JSON.parse(String(sent.options?.body))).toEqual({action:'review'});
        expect(sent.options?.headers).toMatchObject({'X-CSRF-Token':'session-token'});
      }
    }
  });
  it('displays actual API denial feedback without inventing a success', async () => {
    vi.stubGlobal('fetch',async(url:string)=>new Response(JSON.stringify(
      url==='/api/demo/session'?{csrfToken:'token'}:url==='/api/demo/auth'?{user:{id:'raka',name:'Raka Demo',role:'DOCTOR'}}:
      url.endsWith('/privilege')?{target:{id:'raka',name:'Raka Demo',role:'DOCTOR',baseRole:'DOCTOR'},durationMinutes:5,grant:null}:url.endsWith('/transition')?{error:{message:'Akses ditolak.'}}:{consultations:[{id:1001,ownerPatientId:'alya',assignedDoctorId:'raka',status:'PENDING',reason:'Dummy'}]}
    ),{status:url.endsWith('/transition')?403:200}));
    render(AuthorizationPanel);
    await screen.findByRole('button',{name:'Mulai review #1001'});
    await fireEvent.click(screen.getByRole('button',{name:'Mulai review #1001'}));
    await screen.findByText('403: Akses ditolak.');
    expect(screen.queryByText('Perubahan tersimpan pada fixture otorisasi.')).toBeNull();
  });
});

it.each([
  ['raka','PATIENT','request','Ajukan akses dokter sementara','REQUESTED'],
  ['admin','ADMIN','approve','Setujui akses dokter 5 menit','ACTIVE'],
  ['admin','ADMIN','reject','Tolak permintaan akses','REJECTED'],
  ['admin','ADMIN','revoke','Cabut akses sementara','REVOKED']
])('wires privilege action %s / %s / %s with session CSRF',async(id,role,action,label,outcome)=>{
  let status: string|null=action==='request'?null:action==='revoke'?'ACTIVE':'REQUESTED';
  const calls: {body:object;headers?:HeadersInit}[]=[];
  vi.stubGlobal('fetch',async(url:string,options?:RequestInit)=>{
    if(url==='/api/demo/session')return new Response(JSON.stringify({csrfToken:'fresh-token'}));
    if(url==='/api/demo/auth')return new Response(JSON.stringify({user:{id,name:id==='raka'?'Raka Demo':'Admin Demo',role}}));
    if(url.endsWith('/privilege')) {
      if(options?.method==='POST'){calls.push({body:JSON.parse(String(options.body)),headers:options.headers});status=outcome;}
      return new Response(JSON.stringify({target:{id:'raka',name:'Raka Demo',role:status==='ACTIVE'?'DOCTOR':'PATIENT',baseRole:'PATIENT'},durationMinutes:5,grant:status?{status,active:status==='ACTIVE',approvedBy:status==='ACTIVE'?'admin':undefined,expiresAt:status==='ACTIVE'?'2026-11-09T08:30:00.000Z':null}:null}));
    }
    return new Response(JSON.stringify({consultations:[],users:[],decisions:[]}));
  });
  render(AuthorizationPanel);
  await screen.findByRole('button',{name:label});
  if(id==='raka')expect(screen.queryByRole('button',{name:'Setujui akses dokter 5 menit'})).toBeNull();
  await fireEvent.click(screen.getByRole('button',{name:label}));
  await screen.findByText('Perubahan tersimpan pada fixture otorisasi.');
  expect(calls).toHaveLength(1);expect(calls[0].body).toEqual({action});
  expect(calls[0].headers).toMatchObject({'X-CSRF-Token':'fresh-token'});
  expect(screen.getByText(outcome)).toBeTruthy();
});
