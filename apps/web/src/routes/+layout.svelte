<script lang="ts">
  import '../app.css';
  import { page } from '$app/state';
  let { children } = $props();
  const links = [
    { href: '/', label: 'Beranda' },
    { href: '/services', label: 'Layanan' },
    { href: '/labs/sql-injection', label: 'SQL Lab' },
    { href: '/labs/command-injection', label: 'Command Lab' },
    { href: '/report', label: 'Laporan' },
  ];
</script>

<a class="skip-link" href="#main">Lewati ke konten</a>
<div class="top-strip">
  <div class="container">
    <span><span class="dot"></span> LINGKUNGAN EDUKASI LOKAL</span><span
      >TIG13 · Secure Application Development</span
    >
  </div>
</div>
<header class="site-header">
  <div class="container header-inner">
    <a href="/" class="brand" aria-label="CareProbe Lab beranda"
      ><span class="brand-symbol" aria-hidden="true">✚</span><span
        >CareProbe<span class="brand-light"> Lab</span><small
          >CLINIC SECURITY LABORATORY</small
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
      >CareProbe <span class="brand-light">Lab</span></a
    >
    <p>
      Data fiktif. Eksperimen terbatas. Pembelajaran nyata.<br />Hanya untuk
      laboratorium pribadi di localhost — bukan layanan medis.
    </p>
    <span class="footer-tag">LOCAL ONLY ↗</span>
  </div>
</footer>
