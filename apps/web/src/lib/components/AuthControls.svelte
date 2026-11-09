<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authState, logout, restoreAuth } from '../auth';
  let busy = $state(false);
  let error = $state('');
  const roles = { PATIENT: 'Pasien', DOCTOR: 'Dokter', ADMIN: 'Admin' };
  onMount(() => { void restoreAuth(); });
  async function leave() {
    if (busy) return;
    busy = true; error = '';
    try { await logout(); await goto('/login'); }
    catch (caught) { error = caught instanceof Error ? caught.message : 'Logout belum berhasil. Coba lagi.'; }
    finally { busy = false; }
  }
</script>
<div class="account-controls" aria-label="Akun pengguna">
  {#if !$authState.ready}<span class="muted" role="status">Memuat akun…</span>
  {:else if $authState.user}
    <span class="account-identity">{$authState.user.name} <small>{roles[$authState.user.role]}</small></span>
    <button class="button secondary" disabled={busy} onclick={leave}>{busy ? 'Keluar…' : 'Keluar'}</button>
  {:else}<a class="button secondary" href="/login">Masuk</a>{/if}
  {#if error}<span class="notice error" role="alert">{error}</span>
  {:else if $authState.error}<span class="muted" role="status">Status akun belum tersedia. <a href="/login">Coba masuk</a></span>{/if}
</div>
