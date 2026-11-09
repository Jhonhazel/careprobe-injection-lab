<script lang="ts">
  import { onMount } from 'svelte';
  import { authState, authRequest, restoreAuth } from '../auth';
  import { apiRequest, type CatalogResult, type Service } from '../api';
  type Consultation = { id: number; serviceId: number; serviceName: string; ownerPatientId: string; assignedDoctorId: string; reason: string; createdAt: string; status: 'PENDING' | 'IN_REVIEW' | 'COMPLETED' };
  let { allowRequest = false, summary = false }: { allowRequest?: boolean; summary?: boolean } = $props();
  let records = $state<Consultation[]>([]);
  let services = $state<Service[]>([]);
  let serviceId = $state(0);
  let reason = $state('');
  let loading = $state(true);
  let busy = $state(false);
  let error = $state('');
  let feedback = $state('');
  let adminStats = $state<{ accounts: number; pending: number; decisions: number } | null>(null);
  const statusNames = { PENDING: 'Menunggu', IN_REVIEW: 'Dalam review', COMPLETED: 'Selesai' };
  async function load() {
    loading = true; error = ''; records = [];
    try {
      if ($authState.user?.role === 'ADMIN') {
        if (summary) {
          const [accounts, privilege, audit] = await Promise.all([
            authRequest<{ users: unknown[] }>('/accounts'),
            authRequest<{ grant: { status: string } | null }>('/privilege'),
            authRequest<{ decisions: unknown[] }>('/audit')
          ]);
          adminStats = { accounts: accounts.users.length, pending: privilege.grant?.status === 'REQUESTED' ? 1 : 0, decisions: audit.decisions.length };
        }
        return;
      }
      const [data, catalog] = await Promise.all([
        authRequest<{ consultations: Consultation[] }>('/consultations?scope=personal'),
        allowRequest && $authState.user?.role === 'PATIENT' ? apiRequest<CatalogResult>('/api/services') : Promise.resolve(null)
      ]);
      records = data.consultations;
      if (catalog) {
        services = catalog.services;
        const requested = new URLSearchParams(window.location.search).get('serviceId') ?? '';
        serviceId = /^[1-9]\d{0,8}$/.test(requested) && services.some(s => s.id === Number(requested)) ? Number(requested) : services[0]?.id ?? 0;
      }
    } catch (caught) { error = caught instanceof Error ? caught.message : 'Data belum dapat dimuat.'; }
    finally { loading = false; }
  }
  async function submit(event: SubmitEvent) {
    event.preventDefault();
    if (busy) return;
    busy = true; error = ''; feedback = '';
    try {
      await authRequest('/consultations', { serviceId, reason });
      reason = ''; await load(); feedback = 'Permintaan konsultasi berhasil disimpan.';
    } catch (caught) { error = caught instanceof Error ? caught.message : 'Permintaan gagal.'; }
    finally { busy = false; }
  }
  async function transition(id: number, action: 'review' | 'complete') {
    busy = true; error = ''; feedback = '';
    try { await authRequest('/consultations/' + id + '/transition', { action }); await load(); feedback = 'Status konsultasi diperbarui.'; }
    catch (caught) { records = []; error = caught instanceof Error ? caught.message : 'Tindakan ditolak.'; await restoreAuth(); }
    finally { busy = false; }
  }
  async function download(id: number) {
    busy = true; error = '';
    try {
      const text = await authRequest<string>('/consultations/' + id + '/summary', undefined, 'text');
      const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
      const link = document.createElement('a'); link.href = url; link.download = 'careprobe-auth-' + id + '.txt'; link.click(); URL.revokeObjectURL(url);
      feedback = 'Ringkasan konsultasi diunduh.';
    } catch (caught) { error = caught instanceof Error ? caught.message : 'Unduhan ditolak.'; }
    finally { busy = false; }
  }
  onMount(() => { void load(); });
</script>
<section aria-busy={loading || busy}>
  {#if loading}<p role="status" class="notice">Memuat konsultasi Anda…</p>
  {:else if error}<p role="alert" class="notice error">{error}</p><button class="button secondary" onclick={load}>Coba lagi</button>
  {:else if $authState.user?.role === 'ADMIN'}
    {#if adminStats}<div class="dashboard-stats"><p><strong>{adminStats.accounts}</strong>Akun simulasi</p><p><strong>{adminStats.pending}</strong>Permintaan menunggu</p><p><strong>{adminStats.decisions}</strong>Keputusan audit tersimpan</p></div>{/if}
    <div class="panel"><h2>Kelola akses dengan tepat.</h2><p>Admin mengelola hak akses dan audit, tanpa membaca isi konsultasi pasien.</p><a class="button" href="/settings">Kelola hak akses →</a></div>
  {:else}
    {#if summary}
      <div class="dashboard-stats"><p><strong>{records.length}</strong>{$authState.user?.role === 'DOCTOR' ? 'Konsultasi ditugaskan' : 'Konsultasi Anda'}</p><p><strong>{records.filter(r => r.status === 'PENDING').length}</strong>Menunggu: {records.filter(r => r.status === 'PENDING').length}</p><p><strong>{records.filter(r => r.status === 'IN_REVIEW').length}</strong>Dalam review: {records.filter(r => r.status === 'IN_REVIEW').length}</p></div>
      <div class="hero-actions section-note"><a class="button" href={$authState.user?.role === 'PATIENT' ? '/services' : '/consultations'}>{$authState.user?.role === 'PATIENT' ? 'Pilih layanan' : 'Lihat tugas konsultasi'}</a><a class="button secondary" href="/history">Buka riwayat</a></div>
      <h2 class="section-note">Konsultasi terbaru</h2>
    {/if}
    {#if allowRequest && $authState.user?.role === 'PATIENT'}
      <form class="panel consultation-form" onsubmit={submit}>
        <h2>Ajukan konsultasi</h2><p>Permintaan akan tercatat untuk {$authState.user.name}. Gunakan alasan fiktif.</p>
        <label for="care-service">Layanan</label><select id="care-service" bind:value={serviceId} required disabled={busy}>{#each services as service}<option value={service.id}>{service.name}</option>{/each}</select>
        <label for="care-reason">Alasan konsultasi</label><textarea id="care-reason" bind:value={reason} required minlength="3" maxlength="200" disabled={busy}></textarea>
        <button class="button" disabled={busy || !serviceId}>{busy ? 'Menyimpan…' : 'Kirim permintaan'}</button>
      </form>
    {/if}
    {#if records.length === 0}<div class="notice section-note"><p>{$authState.user?.role === 'DOCTOR' ? 'Belum ada konsultasi yang ditugaskan.' : 'Belum ada konsultasi.'}</p>{#if $authState.user?.role === 'PATIENT'}<a href="/services">Pilih layanan untuk memulai →</a>{/if}</div>
    {:else}<div class="care-list section-note">
      {#each (summary ? records.slice().reverse().slice(0, 3) : records.slice().reverse()) as record}
        <article class="panel">
          <div class="care-heading"><h3>{record.serviceName}</h3><span class="status-badge" data-status={record.status}>{statusNames[record.status]}</span></div>
          <p class="muted">#{record.id} · {new Date(record.createdAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB</p>
          <p>{record.reason}</p>
          {#if $authState.user?.role === 'DOCTOR'}<p class="muted">Pasien simulasi: {record.ownerPatientId}</p>{/if}
          <div class="hero-actions"><button class="button secondary" disabled={busy} onclick={() => download(record.id)}>Unduh ringkasan #{record.id}</button>
          {#if $authState.user?.role === 'DOCTOR' && record.status === 'PENDING'}<button class="button" disabled={busy} onclick={() => transition(record.id, 'review')}>Mulai review #{record.id}</button>{/if}
          {#if $authState.user?.role === 'DOCTOR' && record.status === 'IN_REVIEW'}<button class="button" disabled={busy} onclick={() => transition(record.id, 'complete')}>Selesaikan #{record.id}</button>{/if}</div>
        </article>
      {/each}
    </div>{/if}
  {/if}
  {#if feedback}<p role="status" class="notice section-note">{feedback}</p>{/if}
</section>
