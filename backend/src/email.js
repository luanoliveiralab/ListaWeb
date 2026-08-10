const nodemailer = require("nodemailer");

function remetenteConfigurado() {
    const valor = process.env.SMTP_FROM || "ListaWeb <nao-responda@listaweb.app>";
    const correspondencia = valor.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
    return correspondencia ? { name: correspondencia[1] || "ListaWeb", email: correspondencia[2].trim() } : { name: "ListaWeb", email: valor.trim() };
}

function escaparHtml(valor) {
    return String(valor).replace(/[&<>"']/g, (caractere) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[caractere]);
}

function criarTemplate({ nome, titulo, introducao, acao, link, validade, seguranca }) {
    const nomeSeguro = escaparHtml(nome);
    const linkSeguro = escaparHtml(link);
    const texto = [`Olá, ${nome}.`, introducao, `${acao}: ${link}`, validade, seguranca, "ListaWeb — organização simples para a sua vida financeira."].join("\n\n");
    const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escaparHtml(titulo)}</title></head>
<body style="margin:0;background:#f4f7f6;color:#17211e;font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${escaparHtml(introducao)}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f4f7f6"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background:#ffffff;border:1px solid #dfe8e4;border-radius:20px;overflow:hidden;box-shadow:0 8px 30px rgba(23,33,30,.08)">
<tr><td style="background:#123f34;padding:24px 32px"><table role="presentation" cellspacing="0" cellpadding="0"><tr><td style="width:40px;height:40px;border-radius:12px;background:#e8fff5;color:#123f34;font-size:20px;font-weight:bold;text-align:center">L</td><td style="padding-left:12px;color:#ffffff;font-size:22px;font-weight:700">ListaWeb</td></tr></table></td></tr>
<tr><td style="padding:36px 32px 16px"><p style="margin:0 0 12px;color:#55706a;font-size:15px">Olá, ${nomeSeguro}.</p><h1 style="margin:0 0 16px;font-size:28px;line-height:1.25;color:#17211e">${escaparHtml(titulo)}</h1><p style="margin:0;color:#40534e;font-size:16px;line-height:1.7">${escaparHtml(introducao)}</p></td></tr>
<tr><td align="center" style="padding:16px 32px 24px"><a href="${linkSeguro}" style="display:inline-block;background:#123f34;color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:15px 24px;border-radius:12px">${escaparHtml(acao)}</a></td></tr>
<tr><td style="padding:0 32px 28px"><div style="background:#f4f7f6;border-radius:14px;padding:16px"><p style="margin:0 0 6px;color:#40534e;font-size:13px;line-height:1.5">${escaparHtml(validade)}</p><p style="margin:0;color:#687d78;font-size:12px;line-height:1.5">Se o botão não funcionar, copie este endereço:</p><p style="margin:6px 0 0;word-break:break-all;font-size:12px;line-height:1.5"><a href="${linkSeguro}" style="color:#12644f">${linkSeguro}</a></p></div></td></tr>
<tr><td style="padding:20px 32px;border-top:1px solid #e7eeeb"><p style="margin:0;color:#687d78;font-size:12px;line-height:1.6">${escaparHtml(seguranca)}</p></td></tr>
<tr><td style="background:#f8faf9;padding:18px 32px;text-align:center;color:#7b8d88;font-size:11px;line-height:1.5">ListaWeb é gratuito. Esta é uma mensagem automática; não responda a este e-mail.</td></tr>
</table></td></tr></table></body></html>`;
    return { texto, html };
}

async function enviar({ destinatario, nome, assunto, texto, html }) {
    if (process.env.BREVO_API_KEY) {
        const response = await fetch("https://api.brevo.com/v3/smtp/email", { method: "POST", headers: { accept: "application/json", "api-key": process.env.BREVO_API_KEY, "content-type": "application/json" }, body: JSON.stringify({ sender: remetenteConfigurado(), to: [{ email: destinatario, name: nome }], subject: assunto, textContent: texto, htmlContent: html }), signal: AbortSignal.timeout(15_000) });
        if (!response.ok) { const detalhe = await response.text(); throw new Error(`Brevo recusou o envio (${response.status}): ${detalhe.slice(0, 300)}`); }
        return;
    }
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
        const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: process.env.SMTP_SECURE === "true", auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }, connectionTimeout: 15_000 });
        await transporter.sendMail({ from: process.env.SMTP_FROM || "ListaWeb <nao-responda@listaweb.app>", to: destinatario, subject: assunto, text: texto, html });
        return;
    }
    throw new Error("Provedor de e-mail não configurado.");
}

async function enviarEmailRecuperacao({ destinatario, nome, link }) {
    const conteudo = criarTemplate({ nome, titulo: "Redefina sua senha", introducao: "Recebemos uma solicitação para criar uma nova senha para sua conta.", acao: "Criar nova senha", link, validade: "Este link expira em 30 minutos e só pode ser utilizado uma vez.", seguranca: "Se você não solicitou esta alteração, ignore esta mensagem. Sua senha atual continuará válida." });
    return enviar({ destinatario, nome, assunto: "Redefinição de senha — ListaWeb", ...conteudo });
}

async function enviarEmailVerificacao({ destinatario, nome, link }) {
    const conteudo = criarTemplate({ nome, titulo: "Confirme seu e-mail", introducao: "Falta apenas confirmar este endereço para ativar sua conta e começar a usar o ListaWeb.", acao: "Confirmar meu e-mail", link, validade: "Este link expira em 24 horas e só pode ser utilizado uma vez.", seguranca: "Se você não criou uma conta no ListaWeb, ignore esta mensagem com segurança." });
    return enviar({ destinatario, nome, assunto: "Confirme seu e-mail — ListaWeb", ...conteudo });
}

module.exports = { enviarEmailRecuperacao, enviarEmailVerificacao, criarTemplate };
