<script lang="ts">
  import ServiceCatalog from '$lib/components/ServiceCatalog.svelte';
</script>

<svelte:head
  ><title>CareProbe Health — Konsultasi Kesehatan Simulasi</title><meta
    name="description"
    content="Jelajahi layanan kesehatan dan ajukan konsultasi simulasi dengan data fiktif di CareProbe Health."
  /></svelte:head
>

<section class="hero">
  <div class="container hero-grid">
    <div class="hero-copy">
      <span class="pill"
        ><span class="dot"></span> Konsultasi mudah, dari tempat Anda.</span
      >
      <h1>Mulai perjalanan sehat<br /><span>dengan lebih mudah.</span></h1>
      <p>
        Temukan layanan yang sesuai, ajukan permintaan konsultasi, dan lihat
        riwayatnya dalam satu tempat. Seluruh alur di sini menggunakan data simulasi.
      </p>
      <div class="hero-actions">
        <a class="button" href="/consultations"
          >Mulai Konsultasi <span aria-hidden="true">↗</span></a
        ><a class="button secondary" href="/services">Lihat layanan</a>
      </div>
      <div class="hero-notes">
        <span>✓ Pilihan layanan</span><span>✓ Riwayat permintaan</span
        ><span>✓ Data simulasi</span>
      </div>
    </div>
    <div
      class="hero-visual"
      aria-label="Alur konsultasi: pilih layanan, ajukan permintaan, lihat riwayat"
    >
      <div class="visual-top">
        <span class="visual-logo">✚</span><span>CAREPROBE / ALUR KONSULTASI</span
        ><span class="visual-dots">•••</span>
      </div>
      <div class="shield-art" aria-hidden="true">
        <svg viewBox="0 0 220 210" fill="none"
          ><circle
            cx="110"
            cy="105"
            r="91"
            stroke="currentColor"
            stroke-opacity=".12"
          /><circle
            cx="110"
            cy="105"
            r="71"
            stroke="currentColor"
            stroke-opacity=".15"
            stroke-dasharray="3 7"
          /><path
            d="M110 42 161 62v43c0 31-22 51-51 66-29-15-51-35-51-66V62l51-20Z"
            fill="#d9f2ee"
            stroke="#087e83"
            stroke-width="2"
          /><path
            d="M102 78h16v18h18v16h-18v18h-16v-18H84V96h18V78Z"
            fill="#087e83"
          /><circle cx="178" cy="58" r="8" fill="#e8bc78" /><circle
            cx="40"
            cy="147"
            r="5"
            fill="#087e83"
          /></svg
        >
      </div>
      <div class="visual-title">Layanan kesehatan<br />lebih mudah dijelajahi.</div>
      <div class="visual-steps">
        <div><span>01</span>Pilih layanan</div>
        <div><span>02</span>Ajukan</div>
        <div><span>03</span>Lihat riwayat</div>
      </div>
      <div class="visual-bottom">
        <span>LAYANAN → KONSULTASI → RINGKASAN</span><span>↗</span>
      </div>
    </div>
  </div>
</section>
<div class="container trust-band">
  <span>SIMULASI LOKAL</span>
  <p>
    Seluruh layanan, pasien, dan konsultasi di CareProbe Health bersifat fiktif.
  </p>
  <a href="/history">Lihat riwayat →</a>
</div>

<section class="section container">
  <div class="section-heading">
    <div>
      <span class="eyebrow">01 / PILIH LAYANAN</span>
      <h2>Kenali layanan yang tersedia.</h2>
      <p>Cari layanan berdasarkan kebutuhan simulasi Anda.</p>
    </div>
    <a class="text-link" href="/services">Semua layanan ↗</a>
  </div>
  <ServiceCatalog compact />
</section>

<section class="labs-section">
  <div class="section container">
    <div class="section-heading">
      <div>
        <span class="eyebrow">02 / LEBIH MUDAH MELANJUTKAN</span>
        <h2>Satu tempat untuk konsultasi dan riwayat.</h2>
        <p>Ajukan permintaan, lalu simpan ringkasan konsultasi Anda.</p>
      </div>
      <span class="pill">Data fiktif</span>
    </div>
    <div class="two-columns">
      <a class="lab-card" href="/consultations"
        ><span class="lab-card-number"
          >LANGKAH 01 <span aria-hidden="true">↗</span></span
        >
        <div class="lab-icon" aria-hidden="true">✚</div>
        <h3>Ajukan konsultasi</h3>
        <p>
          Pilih layanan, isi nama pasien demo dan alasan singkat, lalu kirim
          permintaan konsultasi.
        </p>
        <span class="lab-card-footer"
          >Permintaan tersimpan <strong>Mulai sekarang →</strong></span
        ></a
      >
      <a class="lab-card" href="/history"
        ><span class="lab-card-number"
          >LANGKAH 02 <span aria-hidden="true">↗</span></span
        >
        <div class="lab-icon" aria-hidden="true">▤</div>
        <h3>Lihat riwayat</h3>
        <p>
          Tinjau permintaan yang pernah dikirim dan unduh ringkasan konsultasi
          dalam dokumen teks.
        </p>
        <span class="lab-card-footer"
          >Ringkasan konsultasi <strong>Lihat riwayat →</strong></span
        ></a
      >
    </div>
  </div>
</section>
<section class="section container">
  <div class="learning-banner">
    <div>
      <span class="eyebrow">MULAI DENGAN MUDAH</span>
      <h2>Siap mengajukan konsultasi?</h2>
      <p>
        Pilih layanan yang tersedia dan kirim permintaan simulasi. Anda dapat
        kembali melihatnya kapan saja selama sesi backend berjalan.
      </p>
    </div>
    <a class="button secondary" href="/consultations"
      >Mulai Konsultasi <span aria-hidden="true">↗</span></a
    >
  </div>
</section>
