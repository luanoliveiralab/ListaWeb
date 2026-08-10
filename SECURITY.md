# Política de segurança

## Configuração segura

Credenciais nunca devem ser gravadas no código, em documentação, imagens, logs ou arquivos versionados. Use os modelos `.env.example` e mantenha os valores reais exclusivamente nas variáveis de ambiente do computador ou do provedor de hospedagem.

Antes de publicar uma alteração, execute:

```bash
node scripts/check-secrets.js
```

O GitHub também executa essa verificação automaticamente em pushes e pull requests. Arquivos `.env`, certificados, chaves privadas, dumps, bancos locais, backups e uploads estão bloqueados pelo `.gitignore`.

> Arquivos rastreados pelo Git são sempre enviados a quem clona o repositório. Não existe parâmetro capaz de esconder parte de um repositório público. Dados privados devem permanecer fora do Git.

## Variáveis obrigatórias de produção

- `DATABASE_URL` ou o conjunto `DB_HOST`, `DB_USER`, `DB_PASSWORD` e `DB_NAME`;
- `JWT_SECRET`, aleatório e com pelo menos 32 caracteres;
- `FRONTEND_URL`, contendo apenas origens autorizadas;
- `NEXT_PUBLIC_API_URL`, que é público e aponta para a API;
- credenciais `BREVO_API_KEY` ou SMTP, configuradas apenas no backend;
- `SMTP_FROM`, correspondente a um remetente verificado.

Variáveis que começam com `NEXT_PUBLIC_` são incorporadas ao frontend e podem ser vistas no navegador. Nunca coloque segredos nelas.

## Se uma credencial for exposta

1. Revogue ou troque a credencial imediatamente.
2. Remova o valor do código e de todo o histórico do Git.
3. Revise logs e atividade do serviço afetado.
4. Avise usuários caso dados pessoais possam ter sido acessados.

Apagar apenas o commit mais recente ou adicionar o arquivo ao `.gitignore` não remove o conteúdo do histórico já publicado.

## Relato de vulnerabilidades

Não abra uma issue pública contendo credenciais, dados pessoais ou instruções de exploração. Entre em contato de forma privada com o mantenedor pelo canal informado na página **Sobre** do ListaWeb ou pelo perfil do autor no GitHub.
