const { execFileSync } = require("node:child_process");
const { readFileSync } = require("node:fs");
const path = require("node:path");

const raiz = path.resolve(__dirname, "..");
const arquivos = execFileSync("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard"], { cwd: raiz })
    .toString("utf8")
    .split("\0")
    .filter(Boolean);

const nomesProibidos = [
    /(^|\/)\.env(?:\.|$)/i,
    /(^|\/)(?:credentials|secrets?)(?:[._-].*)?\.json$/i,
    /\.(?:pem|key|p12|pfx|crt|cer|jks|sqlite3?|dump|sql\.gz)$/i,
];
const excecoes = [/\.env(?:\..+)?\.example$/i, /(^|\/)\.env\.example$/i];
const assinaturas = [
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
    /\bghp_[A-Za-z0-9]{20,}\b/,
    /\bgithub_pat_[A-Za-z0-9_]{20,}\b/,
    /\bsk-[A-Za-z0-9_-]{20,}\b/,
    /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/,
    /\bAKIA[0-9A-Z]{16}\b/,
    /\bxkeysib-[A-Za-z0-9_-]{20,}\b/,
];
const assinaturasForaDeModelos = [
    /\bpostgres(?:ql)?:\/\/[^\s:'"/]+:[^\s@'"/]+@[^\s'"/]+/i,
    /\bmysql:\/\/[^\s:'"/]+:[^\s@'"/]+@[^\s'"/]+/i,
];

const problemas = [];
for (const arquivo of arquivos) {
    const normalizado = arquivo.replaceAll("\\", "/");
    const modelo = excecoes.some((regra) => regra.test(normalizado));
    if (!modelo && nomesProibidos.some((regra) => regra.test(normalizado))) {
        problemas.push(`${arquivo}: nome de arquivo potencialmente confidencial`);
        continue;
    }

    let conteudo;
    try {
        conteudo = readFileSync(path.join(raiz, arquivo), "utf8");
    } catch {
        continue;
    }
    if (conteudo.includes("\0")) continue;
    if (assinaturas.some((regra) => regra.test(conteudo)) || (!modelo && assinaturasForaDeModelos.some((regra) => regra.test(conteudo)))) {
        problemas.push(`${arquivo}: possível segredo encontrado no conteúdo`);
    }
}

if (problemas.length) {
    console.error("Verificação de segurança reprovada:\n- " + problemas.join("\n- "));
    console.error("Remova o dado, use uma variável de ambiente e troque imediatamente qualquer credencial exposta.");
    process.exit(1);
}

console.log(`Verificação de segurança aprovada em ${arquivos.length} arquivos do repositório.`);
