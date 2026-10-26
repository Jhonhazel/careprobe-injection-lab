import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/svelte";
import LabForm from "./LabForm.svelte";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  sessionStorage.clear();
});
describe("lab forms at the HTTP boundary", () => {
  it("shows Docker guidance when the local proxy cannot reach the API", async () => {
    vi.stubGlobal("fetch", async () => new Response(null, { status: 500 }));
    render(LabForm, { props: { kind: "sql" } });
    await fireEvent.click(screen.getByRole("button", { name: "Jalankan tes" }));
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("API_OFFLINE");
    expect(alert.textContent).toContain("Docker Compose");
    expect(screen.queryByText(/layanan ditemukan/)).toBeNull();
  });
  it("defaults to Secure and renders the actual SQL response", async () => {
    let requested = "";
    vi.stubGlobal("fetch", async (url: string) => {
      requested = url;
      return new Response(
        JSON.stringify({
          mode: "secure",
          keyword: "gigi",
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
          query: "SELECT name FROM services WHERE name LIKE ?",
          parameters: ["%gigi%"],
        }),
        { status: 200 },
      );
    });
    render(LabForm, { props: { kind: "sql" } });
    expect(
      (screen.getByLabelText("Mode pengujian") as HTMLSelectElement).value,
    ).toBe("secure");
    await fireEvent.input(screen.getByLabelText("Kata kunci layanan"), {
      target: { value: "gigi" },
    });
    await fireEvent.click(screen.getByRole("button", { name: "Jalankan tes" }));
    await screen.findByText("1 layanan ditemukan");
    expect(requested).toBe("/api/labs/sql?mode=secure&keyword=gigi");
    expect(screen.getByText("Pemeriksaan Gigi")).toBeTruthy();
  });

  it("sends selected command mode and shows controlled sandbox errors", async () => {
    let sent: unknown;
    vi.stubGlobal("fetch", async (_url: string, options: RequestInit) => {
      sent = JSON.parse(String(options.body));
      return new Response(
        JSON.stringify({
          error: {
            code: "SANDBOX_REQUIRED",
            message: "Jalankan Docker Compose.",
          },
        }),
        { status: 503 },
      );
    });
    render(LabForm, { props: { kind: "command" } });
    await fireEvent.change(screen.getByLabelText("Mode pengujian"), {
      target: { value: "vulnerable" },
    });
    await fireEvent.input(screen.getByLabelText("Label diagnostik"), {
      target: { value: "clinic-demo; printf LAB_MARKER" },
    });
    await fireEvent.click(screen.getByRole("button", { name: "Jalankan tes" }));
    await screen.findByRole("alert");
    expect(sent).toEqual({
      mode: "vulnerable",
      label: "clinic-demo; printf LAB_MARKER",
    });
    expect(screen.getByRole("alert").textContent).toContain("SANDBOX_REQUIRED");
  });

  it("shows loading and prevents duplicate submission while pending", async () => {
    let finish!: (value: Response) => void;
    vi.stubGlobal(
      "fetch",
      () =>
        new Promise<Response>((resolve) => {
          finish = resolve;
        }),
    );
    render(LabForm, { props: { kind: "command" } });
    const button = screen.getByRole("button", {
      name: "Jalankan tes",
    }) as HTMLButtonElement;
    await fireEvent.click(button);
    expect(button.disabled).toBe(true);
    expect(screen.getByRole("status").textContent).toContain("Menjalankan");
    finish(
      new Response(
        JSON.stringify({
          mode: "secure",
          label: "clinic-demo",
          output: "diagnostic: clinic-demo\n",
          shell: false,
          timeoutMs: 1000,
          outputLimitBytes: 4096,
        }),
        { status: 200 },
      ),
    );
    await waitFor(() => expect(button.disabled).toBe(false));
    expect(screen.getByText("diagnostic: clinic-demo")).toBeTruthy();
  });

  it("shows an offline error and never fabricates successful results", async () => {
    vi.stubGlobal("fetch", async () => {
      throw new TypeError("fetch failed");
    });
    render(LabForm, { props: { kind: "sql" } });
    await fireEvent.click(screen.getByRole("button", { name: "Jalankan tes" }));
    expect((await screen.findByRole("alert")).textContent).toContain(
      "API tidak dapat dihubungi",
    );
    expect(screen.queryByText(/layanan ditemukan/)).toBeNull();
  });
});
