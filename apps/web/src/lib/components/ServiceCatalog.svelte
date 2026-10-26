<script lang="ts">
  import { onMount } from 'svelte';
  import { apiRequest, type CatalogResult } from '../api';
  import ServiceCards from './ServiceCards.svelte';
  let { compact = false }: { compact?: boolean } = $props();
  let keyword = $state('');
  let loading = $state(true);
  let error = $state('');
  let result = $state<CatalogResult | null>(null);
  async function search(event?: SubmitEvent) {
    event?.preventDefault();
    loading = true;
    error = '';
    result = null;
    try {
      result = await apiRequest<CatalogResult>(
        `/api/services?${new URLSearchParams({ keyword })}`,
      );
    } catch (caught) {
      error = caught instanceof Error ? caught.message : 'Pencarian gagal.';
    } finally {
      loading = false;
    }
  }
  onMount(() => {
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
{/if}
<div aria-live="polite" aria-busy={loading}>
  {#if loading}<p role="status" class="notice">Memuat layanan dari SQLite…</p>
  {:else if error}<p role="alert" class="notice error">{error}</p>
  {:else if result}
    {#if !compact}<p class="catalog-count">
        {result.count} layanan tersedia <span>· Parameter binding aktif</span>
      </p>{/if}
    {#if result.count === 0}<p class="notice">
        Tidak ada layanan yang cocok. Coba kata kunci lain.
      </p>
    {:else}<ServiceCards
        services={compact ? result.services.slice(0, 3) : result.services}
      />{/if}
  {/if}
</div>
