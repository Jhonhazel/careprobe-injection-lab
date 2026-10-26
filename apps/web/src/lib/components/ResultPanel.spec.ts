import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/svelte";
import ResultPanel from "./ResultPanel.svelte";

afterEach(cleanup);
describe("API result presentation", () => {
  it("announces loading while an actual request is pending", () => {
    render(ResultPanel, { props: { loading: true } });
    expect(screen.getByRole("status").textContent).toContain("Menjalankan");
  });
  it("shows an API error instead of a success panel", () => {
    render(ResultPanel, {
      props: { error: "SANDBOX_REQUIRED: Docker belum siap." },
    });
    expect(screen.getByRole("alert").textContent).toContain(
      "Docker belum siap",
    );
    expect(screen.queryByText(/berhasil/i)).toBeNull();
  });
  it("shows zero actual matches as an empty result", () => {
    render(ResultPanel, {
      props: {
        result: {
          mode: "secure",
          keyword: "missing",
          count: 0,
          services: [],
          query: "SELECT name FROM services WHERE name LIKE ?",
          parameters: ["%missing%"],
        },
      },
    });
    expect(screen.getByText("0 layanan ditemukan")).toBeTruthy();
    expect(screen.getByText(/Tidak ada layanan/)).toBeTruthy();
  });
  it("renders bounded output as text, never HTML", () => {
    const { container } = render(ResultPanel, {
      props: {
        result: {
          mode: "vulnerable",
          label: "clinic-demo",
          output: "<img src=x onerror=alert(1)>",
          shell: true,
          timeoutMs: 1000,
          outputLimitBytes: 4096,
        },
      },
    });
    expect(screen.getByText("<img src=x onerror=alert(1)>")).toBeTruthy();
    expect(container.querySelector("img")).toBeNull();
  });
  it("renders every SQL row even when an exploratory SELECT returns duplicate IDs", () => {
    const service = {
      id: 2,
      name: "Pemeriksaan Gigi",
      category: "Pemeriksaan",
      description: "Fiktif",
      duration: 45,
      price: 120000,
    };
    render(ResultPanel, {
      props: {
        result: {
          mode: "vulnerable",
          keyword: "' UNION ALL SELECT * FROM services -- ",
          count: 2,
          services: [service, { ...service }],
          query: "SELECT ... UNION ALL SELECT ...",
          parameters: [],
        },
      },
    });
    expect(screen.getAllByText("Pemeriksaan Gigi")).toHaveLength(2);
    expect(screen.getByText("2 layanan ditemukan")).toBeTruthy();
  });
});
