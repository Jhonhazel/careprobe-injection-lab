<script lang="ts">
  import { onMount } from 'svelte';
  import { authState, authRequest, restoreAuth } from '../auth';
  import { ApiError } from '../api';
  type User = NonNullable<typeof $authState.user>;
  type Consultation = { id: number; ownerPatientId: string; assignedDoctorId: string; status: 'PENDING' | 'IN_REVIEW' | 'COMPLETED'; reason: string };
  type Decision = { timestamp: string; actorId: string; action: string; resourceId: string; allowed: boolean; reason: string };
  type Privilege = { target: User & { baseRole: User['role'] }; durationMinutes: number; grant: { status: 'REQUESTED' | 'ACTIVE' | 'REJECTED' | 'EXPIRED' | 'REVOKED'; active: boolean; requestedAt: string; approvedBy?: string; expiresAt: string | null } | null };
  type Reply = { user?: User | null; csrfToken?: string; consultations?: Consultation[]; consultation?: Consultation; users?: User[]; decisions?: Decision[]; error?: { message: string } };
  let user = $derived($authState.user);
  let records = $state<Consultation[]>([]);
  let users = $state<User[]>([]);
  let decisions = $state<Decision[]>([]);
  let privilege = $state<Privilege | null>(null);
  let reason = $state('');
  let busy = $state(true);
  let feedback = $state('');
  async function api(path: string, body?: object): Promise<Reply> { return authRequest<Reply>(path, body); }
  async function load() {
    records = []; users = []; decisions = []; privilege = null;
    await restoreAuth();
    if ($authState.error) throw new Error($authState.error);
    if (!user) return;
    if (user.id === 'raka' || user.role === 'ADMIN') privilege = await authRequest<Privilege>('/privilege');
    if (user.role === 'ADMIN') {
      users = (await api('/accounts')).users ?? [];
      decisions = (await api('/audit')).decisions ?? [];
    } else records = (await api('/consultations')).consultations ?? [];
  }
  async function run(action: () => Promise<void>) {
    busy = true; feedback = '';
    try { await action(); } catch (error) { feedback = error instanceof ApiError && error.status === 401 ? 'Sesi masuk telah berakhir. Silakan masuk kembali.' : error instanceof ApiError ? `${error.status}: ${error.message}` : error instanceof Error ? error.message : 'Operasi gagal.'; }
    finally { busy = false; }
  }
  async function mutate(path: string, body: object) {
    await run(async () => { await api(path, body); await load(); feedback = 'Perubahan tersimpan pada fixture otorisasi.'; });
  }
  async function summary(id: number) {
    await run(async () => {
      const text = await authRequest<string>(`/consultations/${id}/summary`, undefined, 'text');
      const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
      const link = document.createElement('a'); link.href = url; link.download = `careprobe-auth-${id}.txt`;
      link.click(); URL.revokeObjectURL(url); feedback = 'Ringkasan fixture otorisasi diunduh.';
    });
  }
  onMount(() => { void run(load); });
</script>
<section class="panel section-note" aria-busy={busy}>
  <h2>Pengujian Hak Akses</h2>
  <p>Fixture konsultasi fiktif terpisah dari riwayat umum dan demonstrasi injection. Tidak digunakan untuk layanan medis.</p>
  {#if busy}<p role="status">Memuat akses…</p>{/if}
  {#if user}<p>Masuk sebagai <strong>{user.name}</strong> — {user.role} ({user.id})</p>{:else}<p>Masuk untuk melihat konsultasi yang diizinkan bagi akun Anda. <a href="/login?next=/history">Masuk ke CareProbe Health →</a></p>{/if}
  <button class="button secondary" disabled={busy} onclick={() => run(load)}>Muat ulang hak akses</button>
  {#if user && privilege}
    <section class="notice section-note" aria-label="Akses dokter sementara">
      <h3>Akses dokter sementara</h3>
      <p>Subjek: {privilege.target.name} · Peran dasar: {privilege.target.baseRole} · Peran terkini: {privilege.target.role}</p>
      <p>Status: <strong>{privilege.grant?.status ?? 'BELUM ADA PERMINTAAN'}</strong> · Hak sementara {privilege.grant?.active ? 'aktif' : 'tidak aktif'}.</p>
      {#if privilege.grant?.expiresAt}<p>Berlaku sampai (UTC): {privilege.grant.expiresAt}. Validitas ditentukan waktu server.</p>{/if}
      {#if privilege.grant?.approvedBy}<p>Disetujui oleh: {privilege.grant.approvedBy}</p>{/if}
      {#if user.id === 'raka' && user.role === 'PATIENT' && privilege.grant?.status !== 'REQUESTED' && !privilege.grant?.active}
        <p>Akses DOCTOR untuk latihan selama {privilege.durationMinutes} menit memerlukan persetujuan Admin.</p>
        <button class="button" disabled={busy} onclick={() => mutate('/privilege', { action: 'request' })}>Ajukan akses dokter sementara</button>
      {/if}
      {#if user.role === 'ADMIN' && privilege.grant?.status === 'REQUESTED'}
        <button class="button" disabled={busy} onclick={() => mutate('/privilege', { action: 'approve' })}>Setujui akses dokter 5 menit</button>
        <button class="button secondary" disabled={busy} onclick={() => mutate('/privilege', { action: 'reject' })}>Tolak permintaan akses</button>
      {/if}
      {#if user.role === 'ADMIN' && privilege.grant?.active}
        <button class="button secondary" disabled={busy} onclick={() => mutate('/privilege', { action: 'revoke' })}>Cabut akses sementara</button>
      {/if}
      <p>Gunakan Muat ulang hak akses untuk melihat review dan expiry terbaru. Ini preferensi izin fiktif, bukan layanan medis.</p>
    </section>
  {/if}
  {#if user?.role === 'PATIENT'}
    <form onsubmit={(event) => { event.preventDefault(); void mutate('/consultations', { reason }); }}>
      <label for="auth-reason">Alasan konsultasi fixture</label><input id="auth-reason" bind:value={reason} minlength="3" maxlength="200" required disabled={busy}/>
      <button class="button" disabled={busy}>Ajukan konsultasi fixture</button>
    </form>
  {/if}
  {#if user?.role === 'ADMIN'}
    <h3>Peran akun</h3>
    {#each users as entry}<p>{entry.name} ({entry.id}): {entry.role}</p>{/each}
    <button class="button secondary" disabled={busy} onclick={() => mutate('/roles', { account: 'raka', role: 'PATIENT' })}>Cabut peran dokter Raka</button>
    <button class="button secondary" disabled={busy} onclick={() => mutate('/roles', { account: 'raka', role: 'DOCTOR' })}>Tetapkan peran dokter Raka</button>
    <button class="button secondary" disabled={busy} onclick={() => mutate('/reset', {})}>Reset fixture dan peran Raka</button>
    <h3>Keputusan akses terakhir</h3>
    {#each decisions.slice(-10).reverse() as decision}<p>{decision.timestamp} — {decision.actorId}: {decision.action} / {decision.resourceId} — {decision.allowed ? 'Diizinkan' : 'Ditolak'} ({decision.reason})</p>{/each}
  {:else if user}
    {#each records as record}
      <article class="notice section-note">
        <h3>Konsultasi fixture #{record.id}</h3>
        <p>Pemilik: {record.ownerPatientId} · Dokter: {record.assignedDoctorId} · {record.status}</p><p>{record.reason}</p>
        <button class="button secondary" disabled={busy} onclick={() => summary(record.id)}>Unduh ringkasan fixture #{record.id}</button>
        {#if user?.role === 'DOCTOR' && record.status === 'PENDING'}<button class="button" disabled={busy} onclick={() => mutate(`/consultations/${record.id}/transition`, { action: 'review' })}>Mulai review #{record.id}</button>{/if}
        {#if user?.role === 'DOCTOR' && record.status === 'IN_REVIEW'}<button class="button" disabled={busy} onclick={() => mutate(`/consultations/${record.id}/transition`, { action: 'complete' })}>Selesaikan #{record.id}</button>{/if}
      </article>
    {/each}
    {#if user && records.length === 0}<p>Tidak ada fixture yang diizinkan untuk akun ini.</p>{/if}
  {/if}
  {#if feedback}<p role="status" class="notice">{feedback}</p>{/if}
</section>
