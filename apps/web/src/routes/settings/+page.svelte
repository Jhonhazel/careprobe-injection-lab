<script lang="ts">
  import { onMount } from 'svelte';
  import { loadSecurityMode, saveSecurityMode, securityMode } from '../../lib/security-mode';
  let confirming = $state(false);
  onMount(loadSecurityMode);
</script>

<svelte:head><title>Pengaturan — CareProbe Health</title></svelte:head>
<div class="container page-content">
  <div class="page-intro"><span class="eyebrow">PREFERENSI APLIKASI</span><h1>Pengaturan.</h1><p>Kelola cara aplikasi memproses pencarian layanan dan judul ringkasan konsultasi.</p></div>
  <section class="panel settings-panel">
    <fieldset>
      <legend>Mode Keamanan</legend>
      <label class="mode-choice"><input type="radio" name="security-mode" checked={$securityMode === 'secure' && !confirming} onchange={() => { confirming = false; saveSecurityMode('secure'); }} />Secure (Aman)</label>
      <p>Input diproses menggunakan mekanisme keamanan yang direkomendasikan.</p>
      <label class="mode-choice"><input type="radio" name="security-mode" checked={$securityMode === 'vulnerable' || confirming} onchange={() => { confirming = true; }} />Vulnerable (Rentan — pengujian lokal)</label>
      <p>Mode simulasi untuk pengujian keamanan pada lingkungan lokal terisolasi.</p>
    </fieldset>
    {#if confirming}
      <div class="notice safety section-note" role="alert"><p>Mode rentan hanya untuk pengujian dengan data fiktif pada localhost. Konfirmasi untuk mengaktifkannya. Pembatasan Docker tetap berlaku.</p><div class="hero-actions"><button class="button" onclick={() => { saveSecurityMode('vulnerable'); confirming = false; }}>Aktifkan mode rentan</button><button class="button secondary" onclick={() => { confirming = false; }}>Batal</button></div></div>
    {:else if $securityMode === 'vulnerable'}
      <p role="alert" class="notice safety section-note">Mode rentan sedang aktif. Gunakan hanya data fiktif dan lingkungan lokal pribadi.</p>
    {/if}
    <p class="muted section-note">Preferensi disimpan di browser ini. Data konsultasi tetap disimpan oleh backend dan direset saat backend dimulai ulang.</p>
  </section>
</div>
