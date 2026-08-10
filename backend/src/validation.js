const { HttpError } = require("./http");

const FOTO_MAX_BYTES = 3 * 1024 * 1024;
const FOTO_MIMES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function frontendUrlPrincipal() {
    return (process.env.FRONTEND_URL || "http://localhost:3000")
        .split(",")
        .map((url) => url.trim())
        .find(Boolean) || "http://localhost:3000";
}

function validarFotoDataUrl(foto) {
    if (typeof foto !== "string" || !foto) {
        throw new HttpError(400, "Foto não enviada.", "FOTO_AUSENTE");
    }

    const correspondencia = foto.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/]+={0,2})$/);
    if (!correspondencia || !FOTO_MIMES.has(correspondencia[1])) {
        throw new HttpError(400, "Envie uma imagem JPG, PNG, WebP ou GIF válida.", "FOTO_INVALIDA");
    }

    const base64 = correspondencia[2];
    const bytes = Buffer.from(base64, "base64");
    const normalizado = bytes.toString("base64").replace(/=+$/, "");
    if (!bytes.length || normalizado !== base64.replace(/=+$/, "")) {
        throw new HttpError(400, "A imagem enviada é inválida.", "FOTO_INVALIDA");
    }
    if (bytes.length > FOTO_MAX_BYTES) {
        throw new HttpError(413, "A foto é muito grande. O limite é 3 MB.", "FOTO_MUITO_GRANDE");
    }
    return foto;
}

function booleanoOpcional(body, campo, padrao = true) {
    if (body?.[campo] === undefined) return padrao;
    if (typeof body[campo] !== "boolean") {
        throw new HttpError(400, `O campo ${campo} deve ser verdadeiro ou falso.`, "BOOLEANO_INVALIDO");
    }
    return body[campo];
}

module.exports = { FOTO_MAX_BYTES, frontendUrlPrincipal, validarFotoDataUrl, booleanoOpcional };
