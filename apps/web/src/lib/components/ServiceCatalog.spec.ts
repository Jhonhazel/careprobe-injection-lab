import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/svelte";
import ServiceCatalog from "./ServiceCatalog.svelte";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
describe("database catalog UI", () => {
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
      "/api/services?keyword=",
      "/api/services?keyword=gigi",
    ]);
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
