<script lang="ts">
  import { authState } from '../auth';
  import type { Service } from '../api';
  let { services }: { services: Service[] } = $props();
  const rupiah = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  });
</script>

<div class="service-grid">
  {#each services as service}
    <article class="service-card">
      <div class="service-top">
        <span class="service-icon" aria-hidden="true">✚</span><span
          class="eyebrow">{service.category}</span
        >
      </div>
      <h3>{service.name}</h3>
      <p>{service.description}</p>
      <div class="service-bottom">
        <span>{service.duration} menit</span><strong
          >{rupiah.format(service.price)}</strong
        >
      </div>
      {#if $authState.user?.role === 'PATIENT'}<a class="button secondary section-note" href={'/consultations?serviceId=' + service.id}>Pilih layanan</a>{/if}
    </article>
  {/each}
</div>
