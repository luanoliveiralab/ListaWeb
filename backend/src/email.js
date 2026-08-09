const nodemailer = require("nodemailer");

function remetenteConfigurado() {
    const valor = process.env.SMTP_FROM || "ListaWeb <nao-responda@listaweb.app>";
    const correspondencia = valor.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
    return correspondencia
        ? { name: correspondencia[1] || "ListaWeb", email: correspondencia[2].trim() }
        : { name: "ListaWeb", email: valor.trim() };
}

function escaparHtml(valor) {
    return String(valor).replace(/[&<>"']/g, (caractere) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    })[caractere]);
}

async function enviarPelaApiBrevo({ destinatario, nome, link }) {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
            accept: "application/json",
            "api-key": process.env.BREVO_API_KEY,
            "content-type": "application/json",
        },
        body: JSON.stringify({
            sender: remetenteConfigurado(),
            to: [{ email: destinatario, name: nome }],
            subject: "Redefinição de senha — ListaWeb",
            textContent: `Olá, ${nome}. Redefina sua senha em até 30 minutos: ${link}`,
            htmlContent: `<p>Olá, ${escaparHtml(nome)}.</p><p>Recebemos uma solicitação para redefinir sua senha.</p><p><a href="${escaparHtml(link)}">Criar nova senha</a></p><p>Este link expira em 30 minutos.</p>`,
        }),
        signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
        const detalhe = await response.text();
        throw new Error(`Brevo recusou o envio (${response.status}): ${detalhe.slice(0, 300)}`);
    }
}

async function enviarPorSmtp({ destinatario, nome, link }) {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === "true",
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
        connectionTimeout: 15_000,
    });

    await transporter.sendMail({
        from: process.env.SMTP_FROM || "ListaWeb <nao-responda@listaweb.app>",
        to: destinatario,
        subject: "Redefinição de senha — ListaWeb",
        text: `Olá, ${nome}. Redefina sua senha em até 30 minutos: ${link}`,
        html: `<p>Olá, ${escaparHtml(nome)}.</p><p>Recebemos uma solicitação para redefinir sua senha.</p><p><a href="${escaparHtml(link)}">Criar nova senha</a></p><p>Este link expira em 30 minutos.</p>`,
    });
}

async function enviarEmailRecuperacao(dados) {
    if (process.env.BREVO_API_KEY) return enviarPelaApiBrevo(dados);
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
        return enviarPorSmtp(dados);
    }
    throw new Error("Provedor de e-mail não configurado.");
}

module.exports = { enviarEmailRecuperacao };
