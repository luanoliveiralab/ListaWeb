require("dotenv").config();
const nodemailer = require("nodemailer");

async function testar() {
    const obrigatorias = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASSWORD", "SMTP_FROM"];
    const ausentes = obrigatorias.filter((chave) => !process.env[chave]);
    if (ausentes.length) throw new Error(`Configurações ausentes: ${ausentes.join(", ")}`);

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: process.env.SMTP_SECURE === "true",
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    });

    await transporter.verify();
    if (!process.env.TEST_EMAIL_TO) throw new Error("Defina TEST_EMAIL_TO com o destinatário do teste.");
    const resultado = await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: process.env.TEST_EMAIL_TO,
        subject: "ListaWeb — teste de recuperação de senha",
        text: "A configuração de e-mail do ListaWeb está funcionando corretamente.",
        html: "<h2>ListaWeb</h2><p>A configuração de e-mail está funcionando corretamente.</p>",
    });
    console.log(`E-mail aceito pelo provedor. ID: ${resultado.messageId}`);
}

testar().catch((error) => {
    console.error(`Falha no teste: ${error.message}`);
    process.exitCode = 1;
});
