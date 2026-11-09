<script lang="ts">
  import { untrack, type Snippet } from 'svelte';
  import { goto } from '$app/navigation';
  import { authState, restoreAuth } from '../auth';
  let { path, children }: { path: string; children: Snippet } = $props();
  let checkedPath = $state('');
  let protectedPage = $derived(['/services', '/consultations', '/history', '/settings'].includes(path));
  async function verify(target: string) {
    // Keep the current form mounted on same-route focus checks; first/new routes still wait.
    await restoreAuth();
    checkedPath = target;
  }
  $effect(() => { const target = path; untrack(() => { void verify(target); }); });
  $effect(() => {
    if (protectedPage && checkedPath === path && $authState.ready && !$authState.user && !$authState.error)
      void goto('/login?next=' + encodeURIComponent(path), { replaceState: true });
  });
</script>
<svelte:window onfocus={() => { void verify(path); }} />
{#if !protectedPage}
  {#key $authState.user?.id + ':' + $authState.user?.role}{@render children()}{/key}
{:else if checkedPath !== path || !$authState.ready}
  <div class="container page-content"><p role="status">Memeriksa sesi Anda…</p></div>
{:else if $authState.error}
  <div class="container page-content"><p role="alert" class="notice error">{$authState.error}</p><button class="button" onclick={() => verify(path)}>Coba lagi</button></div>
{:else if $authState.user}
  {#key $authState.user.id + ':' + $authState.user.role}{@render children()}{/key}
{:else}
  <div class="container page-content"><p role="status">Mengarahkan ke halaman masuk…</p></div>
{/if}
