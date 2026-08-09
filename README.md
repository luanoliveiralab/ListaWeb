# ListaWeb

Aplicação web para organizar compras e finanças pessoais em um único lugar.

## Estrutura

- `frontend/`: interface Next.js, páginas, componentes e serviços da API.
- `backend/`: API Express, regras de negócio, segurança e testes.
- `backend/migrations/`: estrutura PostgreSQL.
- `docker-compose.yml`: ambiente completo com frontend, API e banco.

## Recursos

- lista de compras integrada às movimentações;
- receitas, despesas, orçamentos e relatórios;
- recorrências e metas com histórico;
- notificações financeiras;
- autenticação segura e recuperação de senha;
- temas claro e escuro e interface responsiva.

## Desenvolvimento

1. Copie `backend/.env.example` para `backend/.env` e preencha as variáveis.
2. Copie `frontend/.env.example` para `frontend/.env.local` quando precisar alterar a URL da API.
3. Em `backend/`, execute `npm install`, `npm run migrate` e `npm run dev`.
4. Em `frontend/`, execute `npm install` e `npm run dev`.

Frontend: `http://localhost:3000`  
API: `http://localhost:3001`  
Saúde da API: `http://localhost:3001/health`

## Verificações

- Backend: `npm test`
- Frontend: `npm run lint` e `npm run build`
- E-mail: defina `TEST_EMAIL_TO` e execute `node scripts/test-email.js`

Nunca envie arquivos `.env`, chaves SMTP ou credenciais para o repositório.
