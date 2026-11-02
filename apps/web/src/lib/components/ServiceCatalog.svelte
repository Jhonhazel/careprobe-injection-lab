<script lang="ts">
  import { XSS_FRAGMENT } from '../xss-demo';
  import { onMount } from 'svelte';
  import { apiRequest, type CatalogResult } from '../api';
  import ServiceCards from './ServiceCards.svelte';
  import { loadSecurityMode, securityMode } from '../security-mode';
  let { compact = false }: { compact?: boolean } = $props();
  let keyword = $state('');
  let submittedKeyword = $state('');
  let loading = $state(true);
  let error = $state('');
  let result = $state<CatalogResult | null>(null);
  async function search(event?: SubmitEvent) {
    event?.preventDefault();
    submittedKeyword = keyword;
    loading = true;
    error = '';
    result = null;
    try {
      result = await apiRequest<CatalogResult>(
        `/api/services?${new URLSearchParams({ keyword, mode: $securityMode })}`,
      );
    } catch (caught) {
      error = caught instanceof Error ? caught.message : 'Pencarian gagal.';
    } finally {
      loading = false;
    }
  }
  onMount(() => {
    loadSecurityMode();
    if (!compact) keyword = new URLSearchParams(window.location.search).get('keyword') ?? '';
    void search();
  });
</script>

{#if !compact}
  <form class="search-form" onsubmit={search}>
    <div>
      <label for="catalog-search">Cari layanan</label><input
        id="catalog-search"
        bind:value={keyword}
        maxlength="120"
        placeholder="Contoh: gigi, konsultasi…"
        disabled={loading}
      />
    </div>
    <button class="button" type="submit" disabled={loading}
      >Cari layanan <span aria-hidden="true">↗</span></button
    >
  </form>
  <div class="notice" aria-live="polite">
    Hasil pencarian untuk:
    {#if $securityMode === 'vulnerable' && submittedKeyword === XSS_FRAGMENT}
      <!-- DELIBERATELY_VULNERABLE_FOR_LOCAL_LAB: only this exact active fragment reaches innerHTML. -->
      <span data-xss-boundary>{@html submittedKeyword}<span data-xss-marker></span></span>
    {:else}<span data-search-keyword>{submittedKeyword || 'semua layanan'}</span>{/if}
  </div>
{/if}
<div aria-live="polite" aria-busy={loading}>
  {#if loading}<p role="status" class="notice">Memuat layanan…</p>
  {:else if error}<p role="alert" class="notice error">{error}</p>
  {:else if result}
    {#if !compact}<p class="catalog-count">
        {result.count} layanan tersedia
      </p>{/if}
    {#if result.count === 0}<p class="notice">
        Tidak ada layanan yang cocok. Coba kata kunci lain.
      </p>
    {:else}<ServiceCards
        services={compact ? result.services.slice(0, 3) : result.services}
      />{/if}
  {/if}
</div>
