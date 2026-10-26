<script lang="ts">
  import ServiceCatalog from '$lib/components/ServiceCatalog.svelte';
</script>

<svelte:head><title>Layanan — CareProbe Health</title></svelte:head>
<div class="container page-content">
  <div class="page-intro">
    <span class="eyebrow">PILIHAN LAYANAN</span>
    <h1>Temukan layanan yang Anda butuhkan.</h1>
    <p>
      Jelajahi pilihan konsultasi kesehatan simulasi. Cari berdasarkan nama
      layanan, lalu ajukan permintaan konsultasi dengan data fiktif.
    </p>
  </div>
  <ServiceCatalog />
  <aside class="notice section-note">
    Layanan dan harga di halaman ini adalah contoh. Siap melanjutkan?
    <a href="/consultations">Ajukan konsultasi →</a>
  </aside>
</div>
