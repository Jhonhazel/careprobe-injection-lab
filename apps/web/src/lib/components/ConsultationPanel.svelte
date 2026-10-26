<script lang="ts">
  import { onMount } from 'svelte';
  import { apiRequest, type CatalogResult, type Consultation, type Service } from '../api';
  import { loadSecurityMode, securityMode } from '../security-mode';
  let { allowRequest = false }: { allowRequest?: boolean } = $props();
  let records = $state<Consultation[]>([]);
  let services = $state<Service[]>([]);
  let serviceId = $state(1);
  let patientName = $state('');
  let reason = $state('');
  let loading = $state(true);
  let submitting = $state(false);
  let exporting = $state<number | null>(null);
  let exportFeedbackId = $state<number | null>(null);
  let error = $state('');
  let message = $state('');
  let titles = $state<Record<number, string>>({});
  const date = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' });

  async function load() {
    loading = true; error = '';
    try {
      const [history, catalog] = await Promise.all([
        apiRequest<{ consultations: Consultation[] }>('/api/consultations'),
        allowRequest ? apiRequest<CatalogResult>('/api/services') : Promise.resolve(null)
      ]);
      records = history.consultations;
      if (catalog) { services = catalog.services; serviceId = services[0]?.id ?? 1; }
    } catch (caught) { error = caught instanceof Error ? caught.message : 'Data belum dapat dimuat.'; }
    finally { loading = false; }
  }
  onMount(() => { loadSecurityMode(); void load(); });

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    if (submitting) return;
    submitting = true; error = ''; message = '';
    try {
      const response = await apiRequest<{ consultation: Consultation }>('/api/consultations', { serviceId, patientName, reason });
      records = [response.consultation, ...records];
      patientName = ''; reason = '';
      message = 'Permintaan konsultasi berhasil disimpan. Lihat ringkasannya di Riwayat.';
    } catch (caught) { error = caught instanceof Error ? caught.message : 'Permintaan belum dapat disimpan.'; }
    finally { submitting = false; }
  }

  async function download(record: Consultation) {
    if (exporting !== null) return;
    exporting = record.id; exportFeedbackId = record.id; error = ''; message = '';
    try {
      const text = await apiRequest<string>(`/api/consultations/${record.id}/export`, {
        documentTitle: titles[record.id] ?? 'ringkasan-konsultasi', mode: $securityMode
      }, 'text');
      const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url; link.download = `careprobe-konsultasi-${record.id}.txt`;
      document.body.appendChild(link); link.click(); link.remove();
      URL.revokeObjectURL(url);
      message = 'Unduhan ringkasan telah dimulai.';
    } catch (caught) { error = caught instanceof Error ? caught.message : 'Ringkasan belum dapat diunduh.';
      if (caught instanceof Error && 'code' in caught) error = `${caught.code}: ${error}`;
    } finally { exporting = null; }
  }
</script>

{#if loading}<p role="status" class="notice">Memuat konsultasi…</p>{/if}
{#if error && exportFeedbackId === null}<p role="alert" class="notice error">{error}</p>{/if}
{#if message && exportFeedbackId === null}<p role="status" class="notice">{message}</p>{/if}
{#if !loading}
  {#if allowRequest}
    <form class="panel consultation-form" onsubmit={submit}>
      <h2>Ajukan konsultasi</h2>
      <p class="muted">Isi hanya nama dan alasan fiktif. Tidak ada konsultasi medis nyata atau biaya yang diproses.</p>
      <label for="service">Layanan</label><select id="service" bind:value={serviceId} disabled={submitting || services.length === 0} required>{#each services as service}<option value={service.id}>{service.name}</option>{/each}</select>
      <label for="patient">Nama pasien demo</label><input id="patient" bind:value={patientName} maxlength="60" minlength="2" placeholder="Contoh: Rani Demo" required disabled={submitting || services.length === 0} />
      <label for="reason">Alasan konsultasi</label><textarea id="reason" bind:value={reason} maxlength="500" minlength="3" rows="4" placeholder="Tuliskan alasan konsultasi fiktif secara singkat." required disabled={submitting || services.length === 0}></textarea>
      <button class="button" type="submit" disabled={submitting || services.length === 0}>{submitting ? 'Mengirim…' : 'Kirim permintaan'}</button>
    </form>
  {/if}
  <section class="section-note">
    <div class="section-heading"><div><h2>{allowRequest ? 'Permintaan Anda' : 'Daftar konsultasi'}</h2><p>{records.length} konsultasi tersimpan</p></div>{#if allowRequest}<a class="text-link" href="/history">Lihat riwayat & unduh ringkasan →</a>{/if}</div>
    {#if records.length === 0}<p class="notice">Belum ada permintaan konsultasi. <a href="/consultations">Ajukan konsultasi pertama →</a></p>
    {:else}<div class="consultation-list">{#each records as record (record.id)}
      <article class="panel consultation-record">
        <div class="panel-heading"><h3>{record.serviceName}</h3><span class="badge">{record.status === 'PENDING' ? 'Menunggu' : record.status}</span></div>
        <p class="muted">#{record.id} · {date.format(new Date(record.createdAt))} WIB</p>
        <p><strong>{record.patientName}</strong></p><p class="consultation-reason">{record.reason}</p>
        {#if !allowRequest}<div class="export-form">
          <div><label for={`title-${record.id}`}>Judul ringkasan untuk konsultasi {record.id}</label><input id={`title-${record.id}`} value={titles[record.id] ?? 'ringkasan-konsultasi'} oninput={(event) => { titles[record.id] = event.currentTarget.value; }} maxlength="80" disabled={exporting !== null} /><p class="field-help">Judul normal: 1–40 huruf, angka, tanda hubung, atau underscore.</p></div>
          <button class="button secondary" onclick={() => download(record)} disabled={exporting !== null}>{exporting === record.id ? 'Menyiapkan…' : 'Unduh Ringkasan'}</button>
        </div>
          {#if exportFeedbackId === record.id}
            {#if error}<p role="alert" class="notice error section-note">{error}</p>{/if}
            {#if message}<p role="status" class="notice section-note">{message}</p>{/if}
          {/if}
        {/if}
      </article>
    {/each}</div>{/if}
  </section>
{/if}
