import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/svelte";
import ServiceCatalog from "./ServiceCatalog.svelte";
import { saveSecurityMode, securityMode } from '../security-mode';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  localStorage.clear();
  securityMode.set('secure');
  window.history.replaceState(null, '', '/');
});
describe("database catalog UI", () => {
  it.each(['secure', 'vulnerable'] as const)('loads a URL keyword once using the saved %s setting', async (mode) => {
    window.history.replaceState(null, '', '/services?keyword=%27%20OR%201%3D1%20--%20&mode=ignored');
    saveSecurityMode(mode);
    const urls: string[] = [];
    vi.stubGlobal('fetch', async (url: string) => {
      urls.push(url);
      return new Response(JSON.stringify({ mode, keyword: "' OR 1=1 -- ", count: 0, services: [] }));
    });
    render(ServiceCatalog);
    await screen.findByText('0 layanan tersedia');
    expect((screen.getByLabelText('Cari layanan') as HTMLInputElement).value).toBe("' OR 1=1 -- ");
    expect(urls).toEqual([`/api/services?keyword=%27+OR+1%3D1+--+&mode=${mode}`]);
    await fireEvent.input(screen.getByLabelText('Cari layanan'), { target: { value: 'gigi' } });
    await fireEvent.click(screen.getByRole('button', { name: 'Cari layanan' }));
    await screen.findByText('0 layanan tersedia');
    expect(urls).toEqual([
      `/api/services?keyword=%27+OR+1%3D1+--+&mode=${mode}`,
      `/api/services?keyword=gigi&mode=${mode}`
    ]);
  });
  it('does not apply catalog URL input to the compact homepage preview', async () => {
    window.history.replaceState(null, '', '/?keyword=gigi');
    const urls: string[] = [];
    vi.stubGlobal('fetch', async (url: string) => {
      urls.push(url);
      return new Response(JSON.stringify({ mode: 'secure', keyword: '', count: 0, services: [] }));
    });
    render(ServiceCatalog, { props: { compact: true } });
    await screen.findByText(/Tidak ada layanan/);
    expect(urls).toEqual(['/api/services?keyword=&mode=secure']);
  });
  it('renders repeated service IDs returned by a SELECT-only query', async () => {
    const service = { id: 1, name: 'Konsultasi Umum', category: 'Umum', description: '<script>dummy</script>', duration: 30, price: 100000 };
    vi.stubGlobal('fetch', async () => new Response(JSON.stringify({ count: 2, services: [service, service] })));
    const { container } = render(ServiceCatalog);
    await screen.findByText('2 layanan tersedia');
    expect(screen.getAllByText('Konsultasi Umum')).toHaveLength(2);
    expect(container.querySelector('script')).toBeNull();
  });
  it('shows a loading state and prevents a second search while pending', async () => {
    vi.stubGlobal('fetch', () => new Promise(() => {}));
    render(ServiceCatalog);
    expect(screen.getByRole('status').textContent).toContain('Memuat');
    expect((screen.getByRole('button') as HTMLButtonElement).disabled).toBe(true);
  });
  it('explains an empty proxy 500 response without inventing results', async () => {
    vi.stubGlobal('fetch', async () => new Response('', { status: 500 }));
    render(ServiceCatalog);
    expect((await screen.findByRole('alert')).textContent).toContain('Docker Compose');
    expect(screen.queryByText(/layanan tersedia/)).toBeNull();
  });
  it("loads services and searches using the secure browsing endpoint", async () => {
    const urls: string[] = [];
    vi.stubGlobal("fetch", async (url: string) => {
      urls.push(url);
      return new Response(
        JSON.stringify({
          mode: "secure",
          keyword: "",
          count: 1,
          services: [
            {
              id: 2,
              name: "Pemeriksaan Gigi",
              category: "Pemeriksaan",
              description: "Fiktif",
              duration: 45,
              price: 120000,
            },
          ],
        }),
        { status: 200 },
      );
    });
    render(ServiceCatalog);
    await screen.findByText("Pemeriksaan Gigi");
    await fireEvent.input(screen.getByLabelText("Cari layanan"), {
      target: { value: "gigi" },
    });
    await fireEvent.click(screen.getByRole("button", { name: "Cari layanan" }));
    await screen.findByText("1 layanan tersedia");
    expect(urls).toEqual([
      "/api/services?keyword=&mode=secure",
      "/api/services?keyword=gigi&mode=secure",
    ]);
  });
  it('uses the persisted setting without a mode selector or SQL panel', async () => {
    saveSecurityMode('vulnerable');
    let requested = '';
    vi.stubGlobal('fetch', async (url: string) => {
      requested = url;
      return new Response(JSON.stringify({ mode: 'vulnerable', keyword: '', count: 0, services: [] }));
    });
    render(ServiceCatalog);
    await screen.findByText(/Tidak ada layanan/);
    await fireEvent.input(screen.getByLabelText('Cari layanan'), { target: { value: "' OR 1=1 -- " } });
    await fireEvent.click(screen.getByRole('button', { name: 'Cari layanan' }));
    await screen.findByText(/Tidak ada layanan/);
    expect(requested).toBe('/api/services?keyword=%27+OR+1%3D1+--+&mode=vulnerable');
    expect(screen.queryByRole('combobox')).toBeNull();
    expect(screen.queryByText(/Parameter binding|SELECT/)).toBeNull();
  });
  it("shows empty and offline states without invented service cards", async () => {
    vi.stubGlobal(
      "fetch",
      async () =>
        new Response(
          JSON.stringify({
            mode: "secure",
            keyword: "",
            count: 0,
            services: [],
          }),
          { status: 200 },
        ),
    );
    render(ServiceCatalog);
    await screen.findByText(/Tidak ada layanan/);
    vi.stubGlobal("fetch", async () => {
      throw new TypeError("offline");
    });
    await fireEvent.click(screen.getByRole("button", { name: "Cari layanan" }));
    expect((await screen.findByRole("alert")).textContent).toContain(
      "API tidak dapat dihubungi",
    );
    expect(screen.queryByText("Pemeriksaan Gigi")).toBeNull();
  });
});
