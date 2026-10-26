import { existsSync, readFileSync } from "node:fs";

export interface SandboxFacts {
  linux: boolean;
  docker: boolean;
  dedicated: boolean;
  unprivileged: boolean;
  readOnly: boolean;
  noCapabilities: boolean;
  noNewPrivileges: boolean;
  seccomp: boolean;
}

export function permitsCommands(facts: SandboxFacts): boolean {
  return (
    facts.linux &&
    facts.docker &&
    facts.dedicated &&
    facts.unprivileged &&
    facts.readOnly &&
    facts.noCapabilities &&
    facts.noNewPrivileges &&
    facts.seccomp
  );
}

// No environment variable alone can enable execution. Every OS-level check must pass.
export function sandboxReady(): boolean {
  if (process.platform !== "linux") return false;
  try {
    const status = readFileSync("/proc/self/status", "utf8");
    const mounts = readFileSync("/proc/self/mountinfo", "utf8");
    const root = mounts.split("\n").find((line) => line.split(" ")[4] === "/");
    return permitsCommands({
      linux: true,
      docker: existsSync("/.dockerenv"),
      dedicated: process.env.CAREPROBE_SANDBOX === "docker-v1",
      unprivileged:
        process.getuid?.() === 10001 && process.getgid?.() === 10001,
      readOnly: root?.split(" ")[5].split(",").includes("ro") ?? false,
      noCapabilities: /^CapEff:\s+0+$/m.test(status),
      noNewPrivileges: /^NoNewPrivs:\s+1$/m.test(status),
      seccomp: /^Seccomp:\s+2$/m.test(status),
    });
  } catch {
    return false;
  }
}
