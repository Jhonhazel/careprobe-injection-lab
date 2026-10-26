import { execFile } from "node:child_process";
import type { Mode } from "./database.js";
import { LabError } from "./errors.js";
import { sandboxReady } from "./sandbox.js";

const SAFE_LABEL = /^[A-Za-z0-9_-]{1,40}$/;
// The only accepted metacharacters form this single, harmless coursework demonstration.
const LAB_LABEL = /^[A-Za-z0-9_-]{1,40}(; printf LAB_MARKER)?$/;
let running = false;

export async function runCommand(mode: Mode, label: string) {
  if (!(mode === "secure" ? SAFE_LABEL : LAB_LABEL).test(label)) {
    throw new LabError(
      400,
      "VALIDATION_ERROR",
      mode === "secure"
        ? "Label secure: 1–40 huruf, angka, tanda hubung, atau underscore."
        : "Gunakan label 1–40 karakter, opsional diikuti persis: ; printf LAB_MARKER",
    );
  }
  if (!sandboxReady()) {
    throw new LabError(
      503,
      "SANDBOX_REQUIRED",
      "Lab perintah dinonaktifkan. Jalankan API melalui Docker Compose CareProbe dengan seluruh pembatasan sandbox.",
    );
  }
  if (running)
    throw new LabError(
      429,
      "LAB_BUSY",
      "Satu diagnostik sedang berjalan. Coba lagi setelah selesai.",
    );
  running = true;
  try {
    // DELIBERATELY_VULNERABLE_FOR_LOCAL_LAB: the shell interprets concatenated input.
    // This sink is reachable only after the sandbox gate and the fixed demo allowlist.
    const executable = mode === "vulnerable" ? "/bin/sh" : "/usr/bin/printf";
    const args =
      mode === "vulnerable"
        ? ["-c", `/usr/bin/printf 'diagnostic: %s\\n' ${label}`]
        : ["diagnostic: %s\n", label];
    const output = await new Promise<string>((resolve, reject) => {
      execFile(
        executable,
        args,
        {
          shell: false,
          timeout: 1000,
          maxBuffer: 4096,
          killSignal: "SIGKILL",
          encoding: "utf8",
          cwd: "/app",
          env: { PATH: "/usr/bin:/bin", LANG: "C" },
        },
        (error, stdout) => {
          if (error)
            reject(
              new LabError(
                504,
                "COMMAND_LIMIT",
                "Diagnostik gagal atau melewati batas waktu/output.",
              ),
            );
          else resolve(stdout);
        },
      );
    });
    return {
      mode,
      label,
      output,
      shell: mode === "vulnerable",
      timeoutMs: 1000,
      outputLimitBytes: 4096,
    };
  } finally {
    running = false;
  }
}
