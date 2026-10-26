import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import ConsultationPanel from './ConsultationPanel.svelte';
import { saveSecurityMode, securityMode } from '../security-mode';

const record = { id: 3, serviceId: 2, serviceName: 'Pemeriksaan Gigi', patientName: 'Rani Demo', reason: 'Simulasi gigi.', status: 'PENDING', createdAt: '2026-10-26T08:00:00.000Z' };
const service = { id: 2, name: 'Pemeriksaan Gigi', category: 'Pemeriksaan', description: 'Fiktif', duration: 45, price: 120000 };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); localStorage.clear(); securityMode.set('secure'); });

describe('consultation request and history UI', () => {
  it('keeps a rejected request out of history and allows correction', async () => {
    vi.stubGlobal('fetch', async (url: string, options: RequestInit) => {
      if (options.method === 'POST') return json({ error: { code: 'VALIDATION_ERROR', message: 'Input tidak valid.' } }, 400);
      return url === '/api/consultations' ? json({ consultations: [] }) : json({ services: [service] });
    });
    render(ConsultationPanel, { props: { allowRequest: true } });
    await screen.findByText(/Belum ada permintaan/);
    await fireEvent.input(screen.getByLabelText('Nama pasien demo'), { target: { value: 'Rani Demo' } });
    await fireEvent.input(screen.getByLabelText('Alasan konsultasi'), { target: { value: 'Simulasi gigi.' } });
    await fireEvent.click(screen.getByRole('button', { name: 'Kirim permintaan' }));
    expect((await screen.findByRole('alert')).textContent).toContain('Input tidak valid');
    expect(screen.queryByText('Rani Demo')).toBeNull();
    expect((screen.getByRole('button', { name: 'Kirim permintaan' }) as HTMLButtonElement).disabled).toBe(false);
  });
  it('does not retry or send duplicate requests while a submission is pending', async () => {
    let submissions = 0;
    let resolvePost!: (response: Response) => void;
    vi.stubGlobal('fetch', (url: string, options: RequestInit) => {
      if (options.method === 'POST') { submissions++; return new Promise<Response>((resolve) => { resolvePost = resolve; }); }
      return Promise.resolve(url === '/api/consultations' ? json({ consultations: [] }) : json({ services: [service] }));
    });
    render(ConsultationPanel, { props: { allowRequest: true } });
    await screen.findByText(/Belum ada permintaan/);
    await fireEvent.input(screen.getByLabelText('Nama pasien demo'), { target: { value: 'Rani Demo' } });
    await fireEvent.input(screen.getByLabelText('Alasan konsultasi'), { target: { value: 'Simulasi gigi.' } });
    await fireEvent.click(screen.getByRole('button', { name: 'Kirim permintaan' }));
    expect((screen.getByRole('button', { name: 'Mengirim…' }) as HTMLButtonElement).disabled).toBe(true);
    expect(submissions).toBe(1);
    resolvePost(json({ consultation: record }, 201));
    await screen.findByText('Rani Demo');
    expect(submissions).toBe(1);
  });
  it('submits real fields to the API and shows the returned stored consultation', async () => {
    let sent: unknown;
    vi.stubGlobal('fetch', async (url: string, options: RequestInit) => {
      if (options.method === 'POST') { sent = JSON.parse(String(options.body)); return json({ consultation: record }, 201); }
      return url === '/api/consultations' ? json({ consultations: [] }) : json({ mode: 'secure', keyword: '', count: 1, services: [service] });
    });
    render(ConsultationPanel, { props: { allowRequest: true } });
    await screen.findByText(/Belum ada permintaan/);
    await fireEvent.input(screen.getByLabelText('Nama pasien demo'), { target: { value: 'Rani Demo' } });
    await fireEvent.input(screen.getByLabelText('Alasan konsultasi'), { target: { value: 'Simulasi gigi.' } });
    await fireEvent.click(screen.getByRole('button', { name: 'Kirim permintaan' }));
    await screen.findByText('Rani Demo');
    expect(sent).toEqual({ serviceId: 2, patientName: 'Rani Demo', reason: 'Simulasi gigi.' });
    expect(screen.getByText(/Permintaan konsultasi berhasil/)).toBeTruthy();
    expect(screen.getByText('Menunggu')).toBeTruthy();
  });
  it('loads history and escapes untrusted-looking record text', async () => {
    const { container } = renderWithRecords([{ ...record, reason: '<img src=x onerror=alert(1)>' }]);
    expect(await screen.findByText('<img src=x onerror=alert(1)>')).toBeTruthy();
    expect(container.querySelector('img')).toBeNull();
    expect(screen.queryByRole('combobox')).toBeNull();
    expect(screen.queryByText(/SQL|Command Lab|Mode pengujian/)).toBeNull();
  });
  it('shows loading and an offline error without invented records', async () => {
    let reject!: (error: Error) => void;
    vi.stubGlobal('fetch', () => new Promise((_resolve, fail) => { reject = fail; }));
    render(ConsultationPanel);
    expect(screen.getByRole('status').textContent).toContain('Memuat');
    reject(new TypeError('offline'));
    expect((await screen.findByRole('alert')).textContent).toContain('API tidak dapat dihubungi');
    expect(screen.queryByText('Rani Demo')).toBeNull();
  });
  it('sends the selected mode on export and displays backend validation errors', async () => {
    saveSecurityMode('vulnerable');
    let sent: unknown;
    let path = '';
    vi.stubGlobal('fetch', async (url: string, options: RequestInit) => {
      if (options.method === 'POST') {
        path = url; sent = JSON.parse(String(options.body));
        return json({ error: { code: 'SANDBOX_REQUIRED', message: 'Jalankan Docker Compose.' } }, 503);
      }
      return json({ consultations: [record] });
    });
    render(ConsultationPanel);
    await screen.findByText('Rani Demo');
    await fireEvent.input(screen.getByLabelText('Judul ringkasan untuk konsultasi 3'), { target: { value: 'clinic-demo; printf LAB_MARKER' } });
    await fireEvent.click(screen.getByRole('button', { name: 'Unduh Ringkasan' }));
    expect((await screen.findByRole('alert')).textContent).toContain('SANDBOX_REQUIRED');
    expect(screen.getByRole('alert').closest('article')?.textContent).toContain('Rani Demo');
    expect(path).toBe('/api/consultations/3/export');
    expect(sent).toEqual({ mode: 'vulnerable', documentTitle: 'clinic-demo; printf LAB_MARKER' });
  });
  it('downloads actual response text with a controlled filename and MIME type', async () => {
    let blob: Blob | undefined;
    const createObjectURL = vi.fn((value: Blob) => { blob = value; return 'blob:careprobe-test'; });
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL, revokeObjectURL: vi.fn() }));
    let filename = '';
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function(this: HTMLAnchorElement) { filename = this.download; });
    vi.stubGlobal('fetch', async (_url: string, options: RequestInit) => options.method === 'POST'
      ? new Response('CareProbe Health\nPemeriksaan Gigi\nRani Demo\nSimulasi gigi.', { headers: { 'Content-Type': 'text/plain' } })
      : json({ consultations: [record] }));
    render(ConsultationPanel);
    await screen.findByText('Rani Demo');
    await fireEvent.click(screen.getByRole('button', { name: 'Unduh Ringkasan' }));
    await waitFor(() => expect(filename).toBe('careprobe-konsultasi-3.txt'));
    expect(blob?.type).toBe('text/plain;charset=utf-8');
    const contents = await new Promise<string>((resolve) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.readAsText(blob!); });
    expect(contents).toContain('Pemeriksaan Gigi\nRani Demo');
  });
});

function renderWithRecords(consultations: unknown[]) {
  vi.stubGlobal('fetch', async () => json({ consultations }));
  return render(ConsultationPanel);
}
