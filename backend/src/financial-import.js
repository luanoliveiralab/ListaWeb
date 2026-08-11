const crypto = require("node:crypto");

const LIMITE_REGISTROS = 1000;
const LIMITE_BYTES = 1024 * 1024;

function normalizarData(valor) {
    const texto = String(valor || "").trim();
    let ano; let mes; let dia;
    if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) [ano, mes, dia] = texto.split("-").map(Number);
    else if (/^\d{2}\/\d{2}\/\d{4}$/.test(texto)) [dia, mes, ano] = texto.split("/").map(Number);
    else if (/^\d{8}/.test(texto)) [ano, mes, dia] = [Number(texto.slice(0, 4)), Number(texto.slice(4, 6)), Number(texto.slice(6, 8))];
    else return null;
    const data = new Date(Date.UTC(ano, mes - 1, dia));
    if (data.getUTCFullYear() !== ano || data.getUTCMonth() + 1 !== mes || data.getUTCDate() !== dia) return null;
    return `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

function normalizarValor(valor) {
    let texto = String(valor ?? "").trim().replace(/R\$|\s/g, "");
    if (texto.includes(",")) texto = texto.replace(/\./g, "").replace(",", ".");
    const numero = Number(texto);
    return Number.isFinite(numero) ? numero : null;
}

function referencia(formato, partes) {
    return crypto.createHash("sha256").update(`${formato}:${partes.join("|")}`).digest("hex");
}

function dividirCsv(linha, delimitador) {
    const colunas = []; let atual = ""; let aspas = false;
    for (let indice = 0; indice < linha.length; indice += 1) {
        const caractere = linha[indice];
        if (caractere === '"' && linha[indice + 1] === '"') { atual += '"'; indice += 1; }
        else if (caractere === '"') aspas = !aspas;
        else if (caractere === delimitador && !aspas) { colunas.push(atual.trim()); atual = ""; }
        else atual += caractere;
    }
    colunas.push(atual.trim());
    return colunas;
}

function buscarIndice(cabecalhos, nomes) {
    return cabecalhos.findIndex((item) => nomes.includes(item));
}

function parseCsv(conteudo) {
    const linhas = conteudo.replace(/^\uFEFF/, "").split(/\r?\n/).filter((linha) => linha.trim());
    if (linhas.length < 2) throw new Error("O CSV não contém movimentações.");
    const delimitador = (linhas[0].match(/;/g) || []).length >= (linhas[0].match(/,/g) || []).length ? ";" : ",";
    const cabecalhos = dividirCsv(linhas[0], delimitador).map((item) => item.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim());
    const indiceData = buscarIndice(cabecalhos, ["data", "date", "data lancamento"]);
    const indiceDescricao = buscarIndice(cabecalhos, ["descricao", "description", "historico", "memo"]);
    const indiceValor = buscarIndice(cabecalhos, ["valor", "amount", "quantia"]);
    const indiceTipo = buscarIndice(cabecalhos, ["tipo", "type"]);
    if ([indiceData, indiceDescricao, indiceValor].some((indice) => indice < 0)) throw new Error("Use as colunas data, descrição e valor no CSV.");

    return linhas.slice(1, LIMITE_REGISTROS + 1).map((linha, indice) => {
        const colunas = dividirCsv(linha, delimitador);
        const data = normalizarData(colunas[indiceData]);
        const numero = normalizarValor(colunas[indiceValor]);
        const descricao = String(colunas[indiceDescricao] || "Movimentação importada").trim().slice(0, 255);
        if (!data || numero === null || numero === 0 || !descricao) return null;
        const tipoInformado = String(colunas[indiceTipo] || "").toLocaleLowerCase("pt-BR");
        const tipo = tipoInformado.includes("desp") || tipoInformado.includes("debit") || numero < 0 ? "despesa" : "receita";
        return { tipo, descricao, valor: Math.abs(numero), data, referencia_externa: referencia("csv", [indice, linha]) };
    }).filter(Boolean);
}

function tag(bloco, nome) {
    const correspondencia = bloco.match(new RegExp(`<${nome}>([^<\\r\\n]+)`, "i"));
    return correspondencia?.[1]?.trim() || "";
}

function parseOfx(conteudo) {
    const blocos = conteudo.match(/<STMTTRN>[\s\S]*?(?:<\/STMTTRN>|(?=<STMTTRN>|<\/BANKTRANLIST>))/gi) || [];
    if (!blocos.length) throw new Error("O arquivo OFX não contém movimentações reconhecíveis.");
    return blocos.slice(0, LIMITE_REGISTROS).map((bloco, indice) => {
        const data = normalizarData(tag(bloco, "DTPOSTED"));
        const numero = normalizarValor(tag(bloco, "TRNAMT"));
        const descricao = (tag(bloco, "NAME") || tag(bloco, "MEMO") || "Movimentação importada").replace(/\s+/g, " ").slice(0, 255);
        if (!data || numero === null || numero === 0) return null;
        const identificador = tag(bloco, "FITID") || `${indice}:${data}:${descricao}:${numero}`;
        return { tipo: numero < 0 ? "despesa" : "receita", descricao, valor: Math.abs(numero), data, referencia_externa: referencia("ofx", [identificador]) };
    }).filter(Boolean);
}

function interpretarArquivoFinanceiro(formato, conteudo) {
    if (!["csv", "ofx"].includes(formato)) throw new Error("Formato de importação não suportado.");
    if (typeof conteudo !== "string" || !conteudo.trim()) throw new Error("O arquivo está vazio.");
    if (Buffer.byteLength(conteudo, "utf8") > LIMITE_BYTES) throw new Error("O arquivo deve ter no máximo 1 MB.");
    const registros = formato === "csv" ? parseCsv(conteudo) : parseOfx(conteudo);
    if (!registros.length) throw new Error("Nenhuma movimentação válida foi encontrada.");
    return registros;
}

module.exports = { interpretarArquivoFinanceiro, normalizarData, normalizarValor };
