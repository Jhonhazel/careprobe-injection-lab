import { afterEach, it, expect, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { authState, clearAuthentication } from '../auth';
import CarePanel from './CarePanel.svelte';
afterEach(()=>{cleanup();clearAuthentication();vi.unstubAllGlobals();window.history.replaceState(null,'','/');});
const row={id:1004,serviceId:2,serviceName:'Pemeriksaan Gigi',ownerPatientId:'alya',assignedDoctorId:'raka',reason:'Permintaan milik Alya',status:'PENDING',createdAt:'2026-11-09T08:00:00Z'};
it('submits service and reason to the protected API, without a frontend owner field',async()=>{
  authState.set({ready:true,error:'',user:{id:'alya',name:'Alya Demo',role:'PATIENT'}});
  window.history.replaceState(null,'','/consultations?serviceId=2');
  const writes:RequestInit[]=[];let submitted=false;
  vi.stubGlobal('fetch',async(url:string,init?:RequestInit)=>{
    if(url==='/api/demo/session')return new Response(JSON.stringify({csrfToken:'fresh'}));
    if(init?.method==='POST'){writes.push(init);submitted=true;return new Response(JSON.stringify({consultation:row}),{status:201});}
    return new Response(JSON.stringify(url.startsWith('/api/services')?{services:[{id:2,name:'Pemeriksaan Gigi'}]}:{consultations:submitted?[row]:[]}));
  });
  render(CarePanel,{allowRequest:true});
  await screen.findByRole('button',{name:'Kirim permintaan'});
  await fireEvent.input(screen.getByLabelText('Alasan konsultasi'),{target:{value:'Permintaan milik Alya'}});
  await fireEvent.click(screen.getByRole('button',{name:'Kirim permintaan'}));
  await screen.findByText('Permintaan konsultasi berhasil disimpan.');
  expect(writes).toHaveLength(1);expect(JSON.parse(String(writes[0].body))).toEqual({serviceId:2,reason:row.reason});
  expect(writes[0].headers).toMatchObject({'X-CSRF-Token':'fresh'});
  await screen.findByRole('heading',{name:'Pemeriksaan Gigi'});
  expect(screen.queryByLabelText('Nama pasien')).toBeNull();
});
it('derives doctor counts from authorized records and sends the real review action',async()=>{
  authState.set({ready:true,error:'',user:{id:'raka',name:'Dokter Raka',role:'DOCTOR'}});
  let status='PENDING';const paths:string[]=[];
  vi.stubGlobal('fetch',async(url:string,init?:RequestInit)=>{
    paths.push(url);
    if(url==='/api/demo/session')return new Response(JSON.stringify({csrfToken:'fresh'}));
    if(init?.method==='POST'){expect(JSON.parse(String(init.body))).toEqual({action:'review'});status='IN_REVIEW';return new Response('{}');}
    return new Response(JSON.stringify({consultations:[{...row,status}]}));
  });
  render(CarePanel,{summary:true});
  await screen.findByText('Menunggu: 1');
  await fireEvent.click(screen.getByRole('button',{name:'Mulai review #1004'}));
  await screen.findByText('Dalam review: 1');
  expect(paths).toContain('/api/demo/auth/consultations?scope=personal');
  expect(paths).toContain('/api/demo/auth/consultations/1004/transition');
  expect(paths).not.toContain('/api/consultations');
});
it('shows a retryable backend failure instead of a misleading empty history',async()=>{
  authState.set({ready:true,error:'',user:{id:'alya',name:'Alya',role:'PATIENT'}});
  vi.stubGlobal('fetch',async()=>{throw Error('offline');});
  render(CarePanel);
  await screen.findByRole('button',{name:'Coba lagi'});
  expect(screen.queryByText('Belum ada konsultasi.')).toBeNull();
});
it('does not request consultation content for Admin',async()=>{
  authState.set({ready:true,error:'',user:{id:'admin',name:'Admin',role:'ADMIN'}});
  const fetcher=vi.fn();vi.stubGlobal('fetch',fetcher);
  render(CarePanel);
  await screen.findByText(/Admin mengelola hak akses/);
  expect(fetcher).not.toHaveBeenCalled();
});
