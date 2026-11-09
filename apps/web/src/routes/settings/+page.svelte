<script lang="ts">
  import { ApiError, apiRequest } from '../../lib/api';
  import AuthorizationPanel from '../../lib/components/AuthorizationPanel.svelte';
  import ConsultationPanel from '../../lib/components/ConsultationPanel.svelte';
  import { authState, clearAuthentication, restoreAuth } from '../../lib/auth';
  import { onMount } from 'svelte';
  import { loadSecurityMode, saveSecurityMode, securityMode } from '../../lib/security-mode';
  let confirming = $state(false);
  let legacyOpen = $state(false);
  let reminder = $state(false);
  let csrfToken = $state('');
  let sessionReady = $state(false);
  let busy = $state(false);
  let feedback = $state('');
  async function sessionRequest(path: string, body?: object) {
    try { return await apiRequest<{ mode: 'secure' | 'vulnerable'; reminder: boolean; csrfToken: string }>(`/api/demo/${path}`, body, 'json', { 'X-CareProbe-Settings': '1' }); }
    catch (error) { if (error instanceof ApiError && error.status === 401) clearAuthentication(); throw error; }
  }
  async function syncMode(mode: 'secure' | 'vulnerable') {
    busy = true; feedback = '';
    try {
      const data = await sessionRequest('session', { mode });
      csrfToken = data.csrfToken; reminder = data.reminder; sessionReady = true;
      saveSecurityMode(data.mode); confirming = false;
      await restoreAuth();
    } catch (error) { feedback = error instanceof Error ? error.message : 'Sesi demo gagal.'; }
    finally { busy = false; }
  }
  async function reloadPreference() {
    busy = true;
    try {
      const data = await sessionRequest('session');
      reminder = data.reminder; csrfToken = data.csrfToken; saveSecurityMode(data.mode);
      feedback = 'Preferensi dimuat ulang.';
    } catch (error) { feedback = error instanceof Error ? error.message : 'Sesi demo gagal.'; }
    finally { busy = false; }
  }
  async function updateReminder() {
    busy = true;
    try {
      // Login/logout rotates the token; always read the current cookie-bound token first.
      const session = await sessionRequest('session');
      csrfToken = session.csrfToken;
      const data = await sessionRequest('reminder', { enabled: String(!reminder), csrfToken });
      reminder = data.reminder; feedback = 'Pengingat simulasi diperbarui.';
    } catch (error) { feedback = error instanceof Error ? error.message : 'Pembaruan gagal.'; }
    finally { busy = false; }
  }
  onMount(() => { loadSecurityMode(); void syncMode($securityMode); });
</script>

<svelte:head><title>Pengaturan — CareProbe Health</title></svelte:head>
<div class="container page-content">
  <div class="page-intro"><span class="eyebrow">PREFERENSI APLIKASI</span><h1>Pengaturan.</h1><p>Kelola akun, preferensi pengingat, dan lingkungan latihan Anda.</p></div>
  <section class="panel section-note"><h2>Akun Anda</h2><p>{$authState.user?.name} · {$authState.user?.role}</p><p class="muted">Identitas dan izin berasal dari sesi backend. Keluar melalui tombol di header.</p></section>
  <section class="panel section-note">
    <h2>Pengingat konsultasi</h2>
    <p>Preferensi sesi demo: <strong>{reminder ? 'Aktif' : 'Nonaktif'}</strong>. Tidak mengirim notifikasi nyata.</p>
    <p>{sessionReady ? 'Sesi demo aktif (cookie HttpOnly).' : 'Menyiapkan sesi demo…'}</p>
    <button class="button" disabled={busy || !sessionReady} onclick={updateReminder}>{reminder ? 'Nonaktifkan pengingat' : 'Aktifkan pengingat'}</button>
    <button class="button secondary" disabled={busy || !sessionReady} onclick={reloadPreference}>Muat ulang preferensi</button>
  </section>
  <section class="panel settings-panel section-note"><h2>Laboratorium keamanan</h2><p>Pengaturan berikut hanya untuk latihan dengan data fiktif. Konsultasi pribadi selalu memakai pemeriksaan izin Secure.</p>
    <fieldset>
      <legend>Mode Keamanan</legend>
      <label class="mode-choice"><input type="radio" name="security-mode" checked={$securityMode === 'secure' && !confirming} disabled={busy} onchange={() => { void syncMode('secure'); }} />Secure (Aman)</label>
      <p>Input diproses menggunakan mekanisme keamanan yang direkomendasikan.</p>
      <label class="mode-choice"><input type="radio" name="security-mode" disabled={busy} checked={$securityMode === 'vulnerable' || confirming} onchange={() => { confirming = true; }} />Vulnerable (Rentan — pengujian lokal)</label>
      <p>Mode simulasi untuk pengujian keamanan pada lingkungan lokal terisolasi.</p>
    </fieldset>
    {#if confirming}
      <div class="notice safety section-note" role="alert"><p>Mode rentan hanya untuk pengujian dengan data fiktif pada localhost. Konfirmasi untuk mengaktifkannya. Pembatasan Docker tetap berlaku.</p><div class="hero-actions"><button class="button" disabled={busy} onclick={() => { void syncMode('vulnerable'); }}>Aktifkan mode rentan</button><button class="button secondary" onclick={() => { confirming = false; }}>Batal</button></div></div>
    {:else if $securityMode === 'vulnerable'}
      <p role="alert" class="notice safety section-note">Mode rentan sedang aktif. Gunakan hanya data fiktif dan lingkungan lokal pribadi.</p>
    {/if}
    <p class="muted section-note">Preferensi disimpan di browser ini. Data konsultasi tetap disimpan oleh backend dan direset saat backend dimulai ulang.</p>
    {#if feedback}<p role="status">{feedback}</p>{/if}
  </section>
  <AuthorizationPanel />
  <details class="panel section-note" ontoggle={(event) => { legacyOpen = event.currentTarget.open; }}><summary>Fixture legacy untuk latihan ekspor</summary><p>Data global fiktif untuk SQL/Command laboratory, bukan riwayat pribadi Anda. Ekspor ini memerlukan sandbox Docker.</p>{#if legacyOpen}<ConsultationPanel />{/if}</details>
  <p class="muted section-note">Kelola akun melalui tombol Masuk atau Keluar di header. <a href="/history">Kembali ke riwayat pribadi →</a></p>
</div>
