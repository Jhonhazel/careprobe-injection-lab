<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authState, login, loginDestination, restoreAuth } from '../../lib/auth';
  let username = $state('');
  let password = $state('');
  let checking = $state(true);
  let submitting = $state(false);
  let error = $state('');
  let destination = '/history';
  onMount(() => {
    destination = loginDestination(new URLSearchParams(window.location.search).get('next'));
    void restoreAuth().then(async () => {
      checking = false;
      if ($authState.user) await goto(destination, { replaceState: true });
    });
  });
  async function submit(event: SubmitEvent) {
    event.preventDefault();
    if (submitting || checking) return;
    error = '';
    if (!username.trim() || !password) { error = 'Isi nama pengguna dan kata sandi.'; return; }
    submitting = true;
    try {
      await login(username.trim(), password);
      password = '';
      await goto(destination, { replaceState: true });
    } catch (caught) { password = ''; error = caught instanceof Error ? caught.message : 'Tidak dapat masuk. Coba kembali.'; }
    finally { submitting = false; }
  }
</script>
<svelte:head><title>Masuk — CareProbe Health</title></svelte:head>
<div class="container page-content login-shell">
  <section class="panel login-panel">
    <span class="eyebrow">CAREPROBE HEALTH</span>
    <h1>Masuk ke CareProbe Health</h1>
    <p>Akses konsultasi sesuai peran Anda. Aplikasi laboratorium ini menggunakan akun dan data fiktif.</p>
    {#if checking}<p role="status">Memeriksa sesi…</p>{/if}
    <form onsubmit={submit} aria-busy={checking || submitting}>
      <label for="login-username">Nama pengguna</label>
      <input id="login-username" name="username" bind:value={username} autocomplete="username" required maxlength="40" disabled={checking || submitting}/>
      <label for="login-password">Kata sandi</label>
      <input id="login-password" name="password" type="password" bind:value={password} autocomplete="current-password" required maxlength="80" disabled={checking || submitting}/>
      <button class="button" disabled={checking || submitting}>{submitting ? 'Sedang masuk…' : 'Masuk'}</button>
    </form>
    {#if error}<p class="notice error" role="alert">{error}</p>{/if}
    {#if !error && $authState.error}<p class="notice error" role="alert">{$authState.error}</p>{/if}
    <p class="muted section-note">Akun latihan tersedia dalam dokumentasi lokal. Masuk untuk mengakses layanan dan konsultasi pribadi.</p>
    <a href="/">Kembali ke beranda →</a>
  </section>
</div>
