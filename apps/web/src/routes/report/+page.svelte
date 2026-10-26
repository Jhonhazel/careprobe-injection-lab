<script lang="ts">
  import { onMount } from 'svelte';
  import { clearEvidence, readEvidence, type Evidence } from '$lib/api';
  let evidence = $state<Evidence[]>([]);
  onMount(() => {
    evidence = readEvidence();
  });
</script>

<svelte:head><title>Laporan Pengujian — CareProbe Lab</title></svelte:head>
<div class="container page-content">
  <div class="page-intro">
    <span class="eyebrow">CATATAN / MATERIAL 8: INJECTION TESTING</span>
    <h1>Dari eksperimen ke bukti<span class="title-dot">.</span></h1>
    <p>
      Peta pengujian, dampak keamanan, dan hasil API terakhir dari tab ini.
      Jalankan lab untuk mengisi bukti aktual.
    </p>
  </div>
  <div class="notice safety">
    Laporan ini membedakan ekspektasi dari observasi. Bukti sesi disimpan di
    sessionStorage tab, dapat diubah atau dihapus, dan bukan audit permanen.
    Tidak ada status lulus otomatis.
  </div>
  <section class="section-note">
    <div class="panel-heading">
      <h2>Bukti aktual sesi ini</h2>
      <button
        class="text-button"
        onclick={() => {
          clearEvidence();
          evidence = [];
        }}
        disabled={evidence.length === 0}>Hapus bukti sesi</button
      >
    </div>
    {#if evidence.length === 0}<p class="notice">
        Belum ada bukti pengujian pada tab ini. Buka <a
          href="/labs/sql-injection">SQL Lab</a
        >
        atau <a href="/labs/command-injection">Command Lab</a> dan jalankan tes.
      </p>
    {:else}<div class="two-columns">
        {#each evidence as row}<article class="panel evidence-card">
            <div class="panel-heading">
              <h3>
                {row.kind === 'sql' ? 'SQL Injection' : 'Command Injection'}
              </h3>
              <span class="badge" class:danger={row.mode === 'vulnerable'}
                >{row.mode}</span
              >
            </div>
            <p class="muted">
              {new Date(row.time).toLocaleString('id-ID')} · {row.status
                ? `HTTP ${row.status}`
                : 'Tidak ada respons HTTP'}
            </p>
            <p>Input: <code>{row.input || '(kosong)'}</code></p>
            {#if row.error}<p class="notice error">
                {row.error}
              </p>{:else if row.result}<pre>{JSON.stringify(
                  row.result,
                  null,
                  2,
                )}</pre>{/if}
          </article>{/each}
      </div>{/if}
  </section>
  <section class="explanation">
    <span class="eyebrow">PEMETAAN PENGUJIAN</span>
    <h2>Source, flow, sink, control.</h2>
    <div class="table-scroll">
      <table>
        <thead
          ><tr
            ><th>Aspek</th><th>SQL Injection</th><th>Command Injection</th></tr
          ></thead
        ><tbody>
          <tr
            ><th>Source</th><td>Query parameter keyword.</td><td
              >JSON body label.</td
            ></tr
          >
          <tr
            ><th>Flow</th><td
              >Form → GET /api/labs/sql → validasi Zod → searchServices.</td
            ><td
              >Form → POST /api/labs/command → Zod → allowlist → sandbox gate →
              runCommand.</td
            ></tr
          >
          <tr
            ><th>Sink</th><td>SQLite statement.prepare / step.</td><td
              >Vulnerable: /bin/sh -c. Secure: /usr/bin/printf dengan argumen
              terpisah.</td
            ></tr
          >
          <tr
            ><th>Control</th><td
              >Vulnerable tanpa binding; secure memakai binding. Keduanya
              database query-only dan input terbatas.</td
            ><td
              >Vulnerable masih memakai shell; secure tanpa shell dan allowlist
              label. Keduanya memerlukan sandbox.</td
            ></tr
          >
          <tr
            ><th>Ekspektasi tes</th><td
              ><code>' OR 1=1 -- </code>: vulnerable 6 baris; secure 0 baris.</td
            ><td
              ><code>clinic-demo; printf LAB_MARKER</code>: vulnerable output
              marker; secure HTTP 400, tanpa output.</td
            ></tr
          >
          <tr
            ><th>Confidentiality</th><td
              >Pola rentan dapat melewati filter dan membuka data. Lab hanya
              berisi layanan dummy.</td
            ><td
              >Eksekusi tambahan berpotensi membaca data pada sistem nyata;
              akses data tidak didemonstrasikan.</td
            ></tr
          >
          <tr
            ><th>Integrity / availability</th><td
              >Pada sistem nyata, bergantung hak DB. Lab read-only; modifikasi
              dan gangguan tidak diuji.</td
            ><td
              >Perintah bebas berisiko mengubah state atau mengganggu layanan.
              Lab membatasi payload, resource, waktu, dan output.</td
            ></tr
          >
          <tr
            ><th>Perbaikan</th><td
              >Prepared statement dan parameter binding di server; hak database
              minimum.</td
            ><td
              >Executable tetap + argumen terpisah + shell:false + allowlist +
              isolasi.</td
            ></tr
          >
          <tr
            ><th>Retest</th><td
              >Cari gigi pada kedua mode → bandingkan payload yang sama → catat
              count dan parameter.</td
            ><td
              >Label normal kedua mode → marker kedua mode → periksa penolakan
              host dan batas sandbox.</td
            ></tr
          >
        </tbody>
      </table>
    </div>
  </section>
  <section class="learning-banner">
    <div>
      <span class="eyebrow">CHECKLIST BUKTI</span>
      <h2>Siapkan presentasi yang dapat diulang.</h2>
      <p>
        Ambil screenshot input, mode, respons, dan waktu. Sertakan hasil tes
        terminal serta inspeksi Docker. Pisahkan hasil aktual, ekspektasi, dan
        keterbatasan pada laporan tugas.
      </p>
      <p>
        Template lengkap tersedia pada <code>docs/lab-report.md</code> dan
        <code>docs/test-cases.md</code> di proyek lokal.
      </p>
    </div>
    <a class="button secondary" href="/labs/sql-injection">Mulai retest ↗</a>
  </section>
</div>
