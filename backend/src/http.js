const crypto = require("node:crypto");

class HttpError extends Error {
    constructor(status, mensagem, codigo = "REQUISICAO_INVALIDA") {
        super(mensagem);
        this.status = status;
        this.codigo = codigo;
    }
}

function asyncHandler(handler) {
    return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function idPositivo(valor, nome = "ID") {
    const id = Number(valor);
    if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, `${nome} inválido.`, "ID_INVALIDO");
    return id;
}

function periodoValido(mesValor, anoValor) {
    const mes = Number(mesValor);
    const ano = Number(anoValor);
    if (!Number.isInteger(mes) || mes < 1 || mes > 12 || !Number.isInteger(ano) || ano < 2000 || ano > 2200) {
        throw new HttpError(400, "Período inválido.", "PERIODO_INVALIDO");
    }
    return { mes, ano };
}

function criarContextoRequisicao(req, res, next) {
    const recebido = req.headers["x-request-id"];
    req.requestId = typeof recebido === "string" && /^[A-Za-z0-9._-]{1,100}$/.test(recebido)
        ? recebido
        : crypto.randomUUID();
    res.setHeader("X-Request-Id", req.requestId);
    next();
}

function rotaNaoEncontrada(req, _res, next) {
    next(new HttpError(404, `Rota ${req.method} ${req.path} não encontrada.`, "ROTA_NAO_ENCONTRADA"));
}

function tratarErro(err, req, res, _next) {
    const status = Number.isInteger(err.status) ? err.status : 500;
    if (status >= 500) console.error(`[${req.requestId}] Erro não tratado:`, err);
    return res.status(status).json({
        mensagem: status >= 500 ? "Erro interno do servidor." : err.message,
        codigo: status >= 500 ? "ERRO_INTERNO" : err.codigo,
        requestId: req.requestId,
    });
}

module.exports = { HttpError, asyncHandler, idPositivo, periodoValido, criarContextoRequisicao, rotaNaoEncontrada, tratarErro };
