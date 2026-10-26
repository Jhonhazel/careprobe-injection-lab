<script lang="ts">
  import LabForm from '$lib/components/LabForm.svelte';
</script>

<svelte:head><title>SQL Injection Lab — CareProbe Lab</title></svelte:head>
<div class="container page-content">
  <a class="breadcrumb" href="/">Beranda / Laboratorium</a>
  <div class="page-intro">
    <span class="eyebrow">LAB 01 / DATABASE SECURITY</span>
    <h1>SQL Injection Lab<span class="title-dot">.</span></h1>
    <p>
      Satu input, dua cara menyusun query. Amati pengaruh pemisahan data dan
      instruksi SQL.
    </p>
  </div>
  <aside class="notice safety">
    <strong>Laboratorium edukasi lokal.</strong> Hanya SELECT pada data fiktif. Gunakan
    contoh yang disediakan; jangan arahkan pengujian ke aplikasi lain.
  </aside>
  <LabForm kind="sql" />
  <section class="explanation">
    <span class="eyebrow">TELUSURI INPUT</span>
    <h2>Dari kata kunci ke query.</h2>
    <div class="flow">
      <span>Source: input keyword</span><b>→</b><span
        >Flow: GET /api/labs/sql</span
      ><b>→</b><span>Sink: SQLite prepare + step</span>
    </div>
    <div class="two-columns">
      <article class="panel">
        <h3>Vulnerable: struktur dapat berubah</h3>
        <p>
          Backend menggabungkan keyword langsung ke string SQL. Payload <code
            >' OR 1=1 --
          </code> menutup string, membuat kondisi selalu benar, lalu mengomentari
          sisa query. Ekspektasi: 6 baris dummy.
        </p>
        <p>
          <strong>Control:</strong> panjang input, satu statement, database query-only.
          Kontrol ini membatasi lab, tetapi tidak memperbaiki konkatenasi.
        </p>
        <p>
          <strong>Impact:</strong> penyaringan dapat dilewati. Pada sistem nyata,
          pola serupa berisiko membuka data yang tidak semestinya.
        </p>
      </article>
      <article class="panel">
        <h3>Secure: input tetap data</h3>
        <p>
          Query memakai <code>WHERE name LIKE ?</code>. Keyword dikirim melalui
          <code>statement.bind()</code>, sehingga sintaks query tetap sama.
          Payload yang sama diharapkan menghasilkan 0 baris.
        </p>
        <p>
          <strong>Mitigasi:</strong> prepared statement dengan parameter binding
          di server. Validasi frontend saja dapat dilewati melalui HTTP langsung.
        </p>
        <p>
          <strong>Retest:</strong> cari <code>gigi</code> pada kedua mode (1 baris),
          lalu gunakan payload yang sama pada kedua mode dan bandingkan hasil aktual.
        </p>
      </article>
    </div>
  </section>
</div>
