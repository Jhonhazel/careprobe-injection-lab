import { describe, expect, it } from "vitest";
import { permitsCommands, type SandboxFacts } from "./sandbox.js";

const safe: SandboxFacts = {
  linux: true,
  docker: true,
  dedicated: true,
  unprivileged: true,
  readOnly: true,
  noCapabilities: true,
  noNewPrivileges: true,
  seccomp: true,
};

describe("sandbox policy (no child processes)", () => {
  it("permits only the complete sandbox", () => {
    expect(permitsCommands(safe)).toBe(true);
  });
  it.each(Object.keys(safe) as (keyof SandboxFacts)[])(
    "fails closed if %s is missing",
    (key) => {
      expect(permitsCommands({ ...safe, [key]: false })).toBe(false);
    },
  );
});
