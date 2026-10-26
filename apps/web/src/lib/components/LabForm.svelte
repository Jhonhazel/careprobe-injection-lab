<script lang="ts">
  import {
    ApiError,
    apiRequest,
    rememberEvidence,
    type LabKind,
    type Mode,
    type LabResult,
  } from '../api';
  import ResultPanel from './ResultPanel.svelte';
  import { untrack } from 'svelte';
  let { kind }: { kind: LabKind } = $props();
  let input = $state(untrack(() => (kind === 'sql' ? 'gigi' : 'clinic-demo')));
  let mode = $state<Mode>('secure');
  let loading = $state(false);
  let error = $state('');
  let result = $state<LabResult | null>(null);

  async function run(event: SubmitEvent) {
    event.preventDefault();
    if (loading) return;
    loading = true;
    error = '';
    result = null;
    const time = new Date().toISOString();
    try {
      result =
        kind === 'sql'
          ? await apiRequest<LabResult>(
              `/api/labs/sql?${new URLSearchParams({ mode, keyword: input })}`,
            )
          : await apiRequest<LabResult>('/api/labs/command', {
              mode,
              label: input,
            });
      rememberEvidence({ kind, mode, input, time, status: 200, result });
    } catch (caught) {
      const failure =
        caught instanceof ApiError
          ? caught
          : new ApiError(
              0,
              'UNEXPECTED_ERROR',
              'Permintaan tidak dapat diselesaikan.',
            );
      error = `${failure.code}${failure.status ? ` · HTTP ${failure.status}` : ''}: ${failure.message}`;
      rememberEvidence({
        kind,
        mode,
        input,
        time,
        status: failure.status,
        error,
      });
    } finally {
      loading = false;
    }
  }
</script>

<div class="lab-workspace">
  <form class="panel lab-controls" onsubmit={run}>
    <div class="panel-heading">
      <h2>Konfigurasi tes</h2>
      <span class="step">01</span>
    </div>
    <label for="mode">Mode pengujian</label>
    <select id="mode" bind:value={mode} disabled={loading}>
      <option value="secure">Secure — mitigasi aktif</option>
      <option value="vulnerable">Vulnerable — khusus lab</option>
    </select>
    <p class="mode-note" class:warning={mode === 'vulnerable'}>
      {mode === 'secure'
        ? 'Mode aman aktif. Backend memisahkan input dari instruksi.'
        : 'Mode rentan aktif. Gunakan hanya contoh uji lokal di bawah.'}
    </p>
    <label for="lab-input"
      >{kind === 'sql' ? 'Kata kunci layanan' : 'Label diagnostik'}</label
    >
    <input
      id="lab-input"
      bind:value={input}
      maxlength={kind === 'sql' ? 120 : 80}
      required={kind === 'command'}
      disabled={loading}
      autocomplete="off"
      spellcheck="false"
    />
    <p class="field-help">
      {kind === 'sql'
        ? 'Maksimal 120 karakter. Kosong untuk semua layanan. Tanpa titik koma.'
        : 'Label normal: 1–40 huruf, angka, tanda hubung, atau underscore.'}
    </p>
    <button class="button full" type="submit" disabled={loading}
      >{loading ? 'Menjalankan…' : 'Jalankan tes'}
      <span aria-hidden="true">↗</span></button
    >
    <div class="sample">
      <span class="eyebrow">Input demonstrasi</span><code
        >{kind === 'sql'
          ? "' OR 1=1 -- "
          : 'clinic-demo; printf LAB_MARKER'}</code
      >
      <button
        type="button"
        class="text-button"
        disabled={loading}
        onclick={() => {
          input =
            kind === 'sql' ? "' OR 1=1 -- " : 'clinic-demo; printf LAB_MARKER';
        }}>Gunakan contoh ini →</button
      >
    </div>
    <p class="muted">
      Ulangi input yang sama pada kedua mode, lalu buka <a href="/report"
        >laporan sesi</a
      >.
    </p>
  </form>
  <ResultPanel {loading} {error} {result} />
</div>
