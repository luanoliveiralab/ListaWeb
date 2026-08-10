# Laboratório Hono

Este código não participa do servidor de produção. Ele replica uma parte pequena do domínio de cartões usando um repositório injetado e a API Web padrão do Hono.

## O que está sendo avaliado

- Clareza de rotas, middleware e tratamento de erros.
- Facilidade para testar sem subir servidor ou acessar banco real.
- Compatibilidade das mensagens e códigos HTTP com a API Express.
- Custo de migração da autenticação, CSRF, cookies e transações existentes.

## Critério de decisão

O Hono só deve substituir o Express se um segundo protótipo, conectado ao PostgreSQL e aos controles de segurança atuais, reduzir complexidade sem alterar contratos públicos. Até essa validação, Express continua sendo a implementação oficial.
