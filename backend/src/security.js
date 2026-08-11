const tentativas = new Map();
const crypto = require("node:crypto");
const limpezaTentativas = setInterval(() => {
    const agora = Date.now();
    for (const [chave, registro] of tentativas) {
        if (agora >= registro.expiraEm) tentativas.delete(chave);
    }
}, 5 * 60 * 1000);
limpezaTentativas.unref();

function cookieOptions() {
    const sameSite = ["lax", "strict", "none"].includes(process.env.COOKIE_SAME_SITE)
        ? process.env.COOKIE_SAME_SITE
        : "lax";
    const secure = process.env.COOKIE_SECURE === "true" || sameSite === "none";
    return {
        httpOnly: true,
        secure,
        sameSite,
        maxAge: 8 * 60 * 60 * 1000,
        path: "/",
    };
}

function csrfCookieOptions() {
    const options = cookieOptions();
    delete options.httpOnly;
    delete options.maxAge;
    return options;
}

function criarTokenCsrf() {
    return crypto.randomBytes(32).toString("hex");
}

function lerCookies(req) {
    return Object.fromEntries(
        (req.headers.cookie ?? "")
            .split(";")
            .map((item) => item.trim())
            .filter((item) => item.includes("="))
            .map((item) => {
                const separador = item.indexOf("=");
                return [item.slice(0, separador), decodeURIComponent(item.slice(separador + 1))];
            })
    );
}

function protegerCsrf(req, res, next) {
    if (["GET", "HEAD", "OPTIONS"].includes(req.method) || ["/login", "/cadastro", "/verificar-email"].includes(req.path)) {
        return next();
    }

    const cookieToken = lerCookies(req).listaweb_csrf;
    const headerToken = req.headers["x-csrf-token"];

    if (!cookieToken || !headerToken || cookieToken.length !== headerToken.length ||
        !crypto.timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken))) {
        return res.status(403).json({
            mensagem: "Validação de segurança da sessão falhou.",
            codigo: "CSRF_INVALIDO",
        });
    }

    return next();
}

function limitarTentativas({ limite = 8, janelaMs = 15 * 60 * 1000 } = {}) {
    return (req, res, next) => {
        const agora = Date.now();
        const chave = `${req.ip}:${req.path}`;
        const registro = tentativas.get(chave);

        if (!registro || agora >= registro.expiraEm) {
            tentativas.set(chave, { quantidade: 1, expiraEm: agora + janelaMs });
            return next();
        }

        if (registro.quantidade >= limite) {
            res.setHeader("Retry-After", Math.ceil((registro.expiraEm - agora) / 1000));
            return res.status(429).json({ mensagem: "Muitas tentativas. Aguarde alguns minutos e tente novamente." });
        }

        registro.quantidade += 1;
        next();
    };
}

function limparTentativas(req) {
    tentativas.delete(`${req.ip}:${req.path}`);
}

function limparTodasTentativas() {
    tentativas.clear();
}

module.exports = {
    cookieOptions,
    csrfCookieOptions,
    criarTokenCsrf,
    lerCookies,
    protegerCsrf,
    limitarTentativas,
    limparTentativas,
    limparTodasTentativas,
};
