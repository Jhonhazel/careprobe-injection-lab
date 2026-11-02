<script lang="ts">
  import { onMount } from 'svelte';
  import { loadSecurityMode, saveSecurityMode, securityMode } from '../../lib/security-mode';
  let confirming = $state(false);
  let reminder = $state(false);
  let csrfToken = $state('');
  let sessionReady = $state(false);
  let busy = $state(false);
  let feedback = $state('');
  async function sessionRequest(path: string, body?: object) {
    const response = await fetch(`/api/demo/${path}`, { signal: AbortSignal.timeout(5000), ...(body ? {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CareProbe-Settings': '1' },
      body: JSON.stringify(body)
    } : {}) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message ?? 'Sesi demo gagal.');
    return data;
  }
  async function syncMode(mode: 'secure' | 'vulnerable') {
    busy = true; feedback = '';
    try {
      const data = await sessionRequest('session', { mode });
      csrfToken = data.csrfToken; reminder = data.reminder; sessionReady = true;
      saveSecurityMode(data.mode); confirming = false;
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
      const data = await sessionRequest('reminder', { enabled: String(!reminder), csrfToken });
      reminder = data.reminder; feedback = 'Pengingat simulasi diperbarui.';
    } catch (error) { feedback = error instanceof Error ? error.message : 'Pembaruan gagal.'; }
    finally { busy = false; }
  }
  onMount(() => { loadSecurityMode(); void syncMode($securityMode); });
</script>

<svelte:head><title>Pengaturan — CareProbe Health</title></svelte:head>
<div class="container page-content">
  <div class="page-intro"><span class="eyebrow">PREFERENSI APLIKASI</span><h1>Pengaturan.</h1><p>Kelola cara aplikasi memproses pencarian layanan dan judul ringkasan konsultasi.</p></div>
  <section class="panel settings-panel">
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
    <h2>Pengingat konsultasi</h2>
    <p>Preferensi sesi demo: <strong>{reminder ? 'Aktif' : 'Nonaktif'}</strong>. Tidak mengirim notifikasi nyata.</p>
    <p>{sessionReady ? 'Sesi demo aktif (cookie HttpOnly).' : 'Menyiapkan sesi demo…'}</p>
    <button class="button" disabled={busy || !sessionReady} onclick={updateReminder}>{reminder ? 'Nonaktifkan pengingat' : 'Aktifkan pengingat'}</button>
    <button class="button secondary" disabled={busy || !sessionReady} onclick={reloadPreference}>Muat ulang preferensi</button>
    {#if feedback}<p role="status">{feedback}</p>{/if}
  </section>
</div>
