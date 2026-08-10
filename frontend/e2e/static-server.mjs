import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";

const raiz = join(process.cwd(), "out");
const tipos = {
  ".css": "text/css", ".html": "text/html", ".ico": "image/x-icon",
  ".js": "text/javascript", ".json": "application/json", ".png": "image/png",
  ".svg": "image/svg+xml", ".txt": "text/plain", ".woff2": "font/woff2",
};

createServer((req, res) => {
  const caminhoUrl = decodeURIComponent(new URL(req.url ?? "/", "http://localhost").pathname);
  const relativo = caminhoUrl === "/" ? "index.html" : `${caminhoUrl.replace(/^\/+/, "")}${extname(caminhoUrl) ? "" : ".html"}`;
  const arquivo = normalize(join(raiz, relativo));

  if (!arquivo.startsWith(raiz) || !existsSync(arquivo) || !statSync(arquivo).isFile()) {
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    return createReadStream(join(raiz, "404.html")).pipe(res);
  }

  res.writeHead(200, { "Content-Type": `${tipos[extname(arquivo)] ?? "application/octet-stream"}; charset=utf-8` });
  return createReadStream(arquivo).pipe(res);
}).listen(3100, "127.0.0.1");
