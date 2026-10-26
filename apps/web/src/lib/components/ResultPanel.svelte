<script lang="ts">
  import type { LabResult } from '../api';
  import ServiceCards from './ServiceCards.svelte';
  let {
    loading = false,
    error = '',
    result = null,
  }: {
    loading?: boolean;
    error?: string;
    result?: LabResult | null;
  } = $props();
</script>

<section
  class="result-panel"
  aria-label="Hasil API"
  aria-live="polite"
  aria-busy={loading}
>
  <div class="panel-heading">
    <h2>Hasil pengujian</h2>
    <span class="eyebrow">Respons API aktual</span>
  </div>
  {#if loading}
    <p role="status" class="notice">Menjalankan permintaan ke API…</p>
  {:else if error}
    <p role="alert" class="notice error">{error}</p>
  {:else if result}
    <div class="result-meta">
      <span class:danger={result.mode === 'vulnerable'} class="badge"
        >{result.mode === 'secure' ? 'Secure' : 'Vulnerable'}</span
      ><span>HTTP 200 · Berhasil</span>
    </div>
    {#if 'services' in result}
      <h3>{result.count} layanan ditemukan</h3>
      <p>Input: <code>{result.keyword || '(kosong)'}</code></p>
      {#if result.count === 0}<p class="notice">
          Tidak ada layanan yang cocok. Input diproses sesuai mode yang
          ditampilkan.
        </p>{/if}
      <ServiceCards services={result.services} />
      <details open>
        <summary>Query dan parameter</summary>
        <pre>{result.query}</pre>
        <p>Parameter terikat:</p>
        <pre>{JSON.stringify(result.parameters)}</pre>
      </details>
    {:else}
      <p>Label: <code>{result.label}</code></p>
      <p>
        Shell: <strong
          >{result.shell
            ? 'Ya — interpretasi shell aktif'
            : 'Tidak — executable dan argumen terpisah'}</strong
        >
      </p>
      <pre class="terminal" aria-label="Output diagnostik">{result.output}</pre>
      <p class="muted">
        Batas backend: {result.timeoutMs} ms · {result.outputLimitBytes} byte.
      </p>
    {/if}
  {:else}
    <div class="result-idle">
      <span aria-hidden="true">⌘</span>
      <h3>Siap menguji?</h3>
      <p>Jalankan tes untuk melihat respons asli dari laboratorium lokal.</p>
    </div>
  {/if}
</section>
