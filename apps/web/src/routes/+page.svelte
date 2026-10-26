<script lang="ts">
  import ServiceCatalog from '$lib/components/ServiceCatalog.svelte';
</script>

<svelte:head
  ><title>CareProbe Lab — Laboratorium Keamanan Klinik</title><meta
    name="description"
    content="Laboratorium lokal untuk mempelajari SQL Injection, Command Injection, dan mitigasinya dengan data klinik fiktif."
  /></svelte:head
>

<section class="hero">
  <div class="container hero-grid">
    <div class="hero-copy">
      <span class="pill"
        ><span class="dot"></span> Klinik fiktif. Ruang belajar nyata.</span
      >
      <h1>Kenali celahnya.<br /><span>Bangun pertahanannya.</span></h1>
      <p>
        Jelajahi keamanan aplikasi dalam konteks klinik sederhana. Uji injection
        secara terkendali, amati hasilnya, lalu buktikan mitigasinya.
      </p>
      <div class="hero-actions">
        <a class="button" href="/labs/sql-injection"
          >Mulai eksplorasi lab <span aria-hidden="true">↗</span></a
        ><a class="button secondary" href="/services">Lihat layanan</a>
      </div>
      <div class="hero-notes">
        <span>✓ SQLite sungguhan</span><span>✓ Data sepenuhnya fiktif</span
        ><span>✓ Lokal & terisolasi</span>
      </div>
    </div>
    <div
      class="hero-visual"
      aria-label="Alur belajar: identifikasi, observasi, mitigasi"
    >
      <div class="visual-top">
        <span class="visual-logo">✚</span><span>CAREPROBE / LEARNING PATH</span
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
      <div class="visual-title">Keamanan dimulai<br />dari pemahaman.</div>
      <div class="visual-steps">
        <div><span>01</span>Identifikasi</div>
        <div><span>02</span>Observasi</div>
        <div><span>03</span>Mitigasi</div>
      </div>
      <div class="visual-bottom">
        <span>INPUT → FLOW → SINK → CONTROL</span><span>↗</span>
      </div>
    </div>
  </div>
</section>
<div class="container trust-band">
  <span>LABORATORIUM PRIBADI</span>
  <p>
    Tanpa pasien nyata. Tanpa layanan eksternal. Semua pengujian hanya di
    lingkungan Anda sendiri.
  </p>
  <a href="/report">Panduan bukti →</a>
</div>

<section class="section container">
  <div class="section-heading">
    <div>
      <span class="eyebrow">01 / KATALOG KLINIK</span>
      <h2>Layanan fiktif, data dari database.</h2>
      <p>Konteks sederhana untuk memahami perjalanan input menuju query.</p>
    </div>
    <a class="text-link" href="/services">Semua layanan ↗</a>
  </div>
  <ServiceCatalog compact />
</section>

<section class="labs-section">
  <div class="section container">
    <div class="section-heading">
      <div>
        <span class="eyebrow">02 / RUANG EKSPERIMEN</span>
        <h2>Dua celah. Satu tujuan: aplikasi lebih aman.</h2>
        <p>Bandingkan mode Secure dan Vulnerable dengan input yang sama.</p>
      </div>
      <span class="pill">Secure secara default</span>
    </div>
    <div class="two-columns">
      <a class="lab-card" href="/labs/sql-injection"
        ><span class="lab-card-number"
          >LAB 01 <span aria-hidden="true">↗</span></span
        >
        <div class="lab-icon" aria-hidden="true">{`{ }`}</div>
        <h3>SQL Injection</h3>
        <p>
          Lihat bagaimana input mengubah struktur query, lalu cegah dengan
          prepared statement.
        </p>
        <span class="lab-card-footer"
          >SQLite · Pencarian layanan <strong>Buka lab →</strong></span
        ></a
      >
      <a class="lab-card" href="/labs/command-injection"
        ><span class="lab-card-number"
          >LAB 02 <span aria-hidden="true">↗</span></span
        >
        <div class="lab-icon" aria-hidden="true">&gt;_</div>
        <h3>Command Injection</h3>
        <p>
          Amati interpretasi shell melalui marker aman di Docker dan bandingkan
          dengan eksekusi tanpa shell.
        </p>
        <span class="lab-card-footer"
          >Docker · Diagnostic formatter <strong>Buka lab →</strong></span
        ></a
      >
    </div>
  </div>
</section>
<section class="section container">
  <div class="learning-banner">
    <div>
      <span class="eyebrow">AMATI. CATAT. UJI ULANG.</span>
      <h2>Hasil pengujian menjadi bahan laporan.</h2>
      <p>
        Telusuri source, flow, sink, dampak, dan mitigasi. Catat hanya bukti
        yang benar-benar Anda jalankan.
      </p>
    </div>
    <a class="button secondary" href="/report"
      >Buka laporan <span aria-hidden="true">↗</span></a
    >
  </div>
</section>
