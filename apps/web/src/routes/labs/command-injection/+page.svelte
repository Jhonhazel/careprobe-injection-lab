<script lang="ts">
  import LabForm from '$lib/components/LabForm.svelte';
</script>

<svelte:head><title>Command Injection Lab — CareProbe Lab</title></svelte:head>
<div class="container page-content">
  <a class="breadcrumb" href="/">Beranda / Laboratorium</a>
  <div class="page-intro">
    <span class="eyebrow">LAB 02 / COMMAND SECURITY</span>
    <h1>Command Injection Lab<span class="title-dot">.</span></h1>
    <p>
      Format label diagnostik dengan printf. Pelajari perbedaan interpretasi
      shell dan argumen terpisah.
    </p>
  </div>
  <aside class="notice safety">
    <strong>Docker wajib untuk kedua mode.</strong> API menolak eksekusi di luar
    sandbox yang sesuai. Hanya label biasa dan satu payload marker tetap yang diperbolehkan.
  </aside>
  <LabForm kind="command" />
  <section class="explanation">
    <span class="eyebrow">TELUSURI INPUT</span>
    <h2>Ketika label menjadi instruksi.</h2>
    <div class="flow">
      <span>Source: body.label</span><b>→</b><span
        >Flow: validasi + sandbox gate</span
      ><b>→</b><span>Sink: execFile</span>
    </div>
    <div class="two-columns">
      <article class="panel">
        <h3>Vulnerable: shell menafsirkan separator</h3>
        <p>
          Backend menyusun string <code
            >/usr/bin/printf 'diagnostic: %s\n' LABEL</code
          >
          lalu menjalankannya melalui <code>/bin/sh -c</code>. Pada payload
          contoh, titik koma memulai printf kedua yang benar-benar mencetak
          <code>LAB_MARKER</code>.
        </p>
        <p>
          <strong>Control:</strong> sandbox Linux, allowlist payload tetap, satu
          proses diagnostik per waktu, timeout 1 detik, output 4 KiB. Tidak ada shell
          bebas.
        </p>
        <p>
          <strong>Impact:</strong> instruksi tambahan dapat dijalankan dengan hak
          proses. Dalam lab ini dampak dibatasi pada output marker; kompromi host
          tidak diuji.
        </p>
      </article>
      <article class="panel">
        <h3>Secure: executable dan argumen terpisah</h3>
        <p>
          <code
            >execFile('/usr/bin/printf', [format, label], &#123; shell: false
            &#125;)</code
          > menjaga label sebagai argumen. Allowlist server hanya menerima 1–40 huruf,
          angka, tanda hubung, dan underscore.
        </p>
        <p>
          <strong>Mitigasi:</strong> hindari shell, gunakan executable tetap dan
          argumen terpisah. Payload marker ditolak dengan HTTP 400 sebelum eksekusi.
        </p>
        <p>
          <strong>Retest:</strong> <code>clinic-demo</code> berhasil pada kedua mode
          dalam Docker. Payload contoh mencetak marker hanya di vulnerable; secure
          menolak. Di host, label biasa menghasilkan HTTP 503 pada kedua mode.
        </p>
      </article>
    </div>
  </section>
</div>
