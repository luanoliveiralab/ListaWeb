import { spawn } from "node:child_process";

const servidor = spawn(process.execPath, ["e2e/static-server.mjs"], { stdio: "inherit" });

async function aguardarServidor() {
  for (let tentativa = 0; tentativa < 50; tentativa += 1) {
    try {
      const resposta = await fetch("http://127.0.0.1:3100");
      if (resposta.ok) return;
    } catch { /* O servidor ainda está iniciando. */ }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("O servidor de testes não iniciou a tempo.");
}

try {
  await aguardarServidor();
  const windows = process.platform === "win32";
  const comando = windows ? (process.env.ComSpec ?? "cmd.exe") : "npx";
  const argumentos = windows ? ["/d", "/s", "/c", "npx.cmd playwright test"] : ["playwright", "test"];
  const testes = spawn(comando, argumentos, { stdio: "inherit" });
  const codigo = await new Promise((resolve) => testes.on("exit", (valor) => resolve(valor ?? 1)));
  process.exitCode = Number(codigo);
} finally {
  servidor.kill();
}
