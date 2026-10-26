<script lang="ts">
  import ServiceCatalog from '$lib/components/ServiceCatalog.svelte';
</script>

<svelte:head><title>Layanan Fiktif — CareProbe Lab</title></svelte:head>
<div class="container page-content">
  <div class="page-intro">
    <span class="eyebrow">KATALOG / SQLITE</span>
    <h1>Layanan klinik fiktif.</h1>
    <p>
      Enam layanan sintetis dari database di memori. Pencarian selalu
      menggunakan parameter binding di backend.
    </p>
    <span class="badge">Secure browsing</span>
  </div>
  <ServiceCatalog />
  <aside class="notice section-note">
    Ini bukan layanan medis. Harga, durasi, dan layanan hanya data latihan.
    Untuk membandingkan perilaku query, buka <a href="/labs/sql-injection"
      >SQL Injection Lab →</a
    >
  </aside>
</div>
