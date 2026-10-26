<script lang="ts">
  import '../app.css';
  import { page } from '$app/state';
  let { children } = $props();
  const links = [
    { href: '/', label: 'Beranda' },
    { href: '/services', label: 'Layanan' },
    { href: '/consultations', label: 'Konsultasi' },
    { href: '/history', label: 'Riwayat' },
    { href: '/settings', label: 'Pengaturan' },
  ];
</script>

<a class="skip-link" href="#main">Lewati ke konten</a>
<div class="top-strip">
  <div class="container">
    <span><span class="dot"></span> LAYANAN KONSULTASI SIMULASI</span><span
      >Mudah diakses dari rumah</span
    >
  </div>
</div>
<header class="site-header">
  <div class="container header-inner">
    <a href="/" class="brand" aria-label="CareProbe Health beranda"
      ><span class="brand-symbol" aria-hidden="true">✚</span><span
        >CareProbe<span class="brand-light"> Health</span><small
          >KONSULTASI KESEHATAN SIMULASI</small
        ></span
      ></a
    >
    <nav aria-label="Navigasi utama">
      {#each links as link}<a
          href={link.href}
          aria-current={page.url.pathname === link.href ? 'page' : undefined}
          >{link.label}</a
        >{/each}
    </nav>
  </div>
</header>
<main id="main">{@render children()}</main>
<footer class="site-footer">
  <div class="container footer-inner">
    <a class="brand footer-brand" href="/"
      >CareProbe <span class="brand-light">Health</span></a
    >
    <p>
      Simulasi layanan kesehatan — data fiktif.<br />Bukan layanan medis
      nyata. Hanya tersedia di localhost.
    </p>
    <span class="footer-tag">SIMULASI LOKAL</span>
  </div>
</footer>
