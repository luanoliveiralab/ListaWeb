# ListaWeb

![Licença MIT](https://img.shields.io/badge/licen%C3%A7a-MIT-2ea44f)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-19-149eca)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-336791)
![Testes](https://img.shields.io/badge/testes-57%20aprovados-success)

O **ListaWeb** é uma aplicação pública, gratuita e de código aberto para organizar compras, finanças pessoais e planejamento em um único lugar. O projeto nasceu para transformar tarefas financeiras cotidianas em uma experiência simples, visual e acessível, sem exigir planilhas complexas.

🔗 **Aplicação:** [listaweb.netlify.app](https://listaweb.netlify.app/)

> O ListaWeb não possui integração direta com bancos. As informações financeiras são cadastradas e controladas pelo próprio usuário.

## Funcionalidades

- lista de compras com categorias, quantidade, valores e confirmação de pagamento;
- escolha entre saldo e cartão de crédito ao concluir uma compra;
- receitas, despesas, saldo, filtros e movimentações parceladas;
- até quatro cartões, com identidade visual por instituição;
- crédito disponível, faturas mensais, fechamento e pagamento de faturas;
- orçamentos por categoria e alertas de consumo;
- metas financeiras com depósitos, retiradas e histórico;
- receitas e despesas recorrentes;
- categorias personalizadas e seleção das páginas onde cada uma aparece;
- central de avisos e notificações financeiras;
- perfil, avatar, alteração de dados e exclusão da conta;
- cadastro com confirmação de e-mail e recuperação de senha;
- tema claro e escuro;
- interface responsiva para desktop e dispositivos móveis;
- página pública sobre o propósito e as fases do projeto.

## Tecnologias

### Frontend

- **Next.js 16**, **React 19** e **TypeScript**;
- **Tailwind CSS 4** e componentes baseados em **Base UI/shadcn**;
- **TanStack Query** para cache e sincronização das informações;
- **Recharts** para gráficos financeiros;
- **Lucide React** para ícones;
- **Playwright** e **axe-core** para jornadas, responsividade e acessibilidade.

### Backend

- **Node.js 22** e **Express 5**;
- **PostgreSQL 17**;
- autenticação com **JWT** em cookie HttpOnly;
- **bcrypt** para hash de senhas;
- **Helmet**, CORS, proteção CSRF e limitação de tentativas;
- **Nodemailer/Brevo** para e-mails transacionais;
- migrações SQL versionadas e testes com o test runner nativo do Node.js.

### Infraestrutura

- frontend hospedado no **Netlify**;
- API preparada para **Render**;
- banco compatível com **Neon PostgreSQL**;
- ambiente local e alternativa de publicação com **Docker Compose** e **Nginx**.

## Arquitetura

```text
Navegador
   │
   ├── Next.js/React ── interface, cache e gráficos
   │
   └── API Express ── autenticação e regras de negócio
            │
            ├── PostgreSQL ── usuários e dados financeiros
            └── Brevo/SMTP ── verificação e recuperação de conta
```

```text
ListaWeb/
├── frontend/            Interface, páginas, componentes e testes E2E
├── backend/             API, segurança, regras de negócio e testes
│   ├── migrations/      Estrutura e evolução do PostgreSQL
│   ├── scripts/         Migrações, backup e verificações auxiliares
│   ├── src/             Módulos da aplicação
│   └── tests/           Testes automatizados do backend
├── docs/                Homologação, feedbacks e auditorias
├── docker-compose.yml   Ambiente completo para desenvolvimento
└── netlify.toml         Build, proxy e headers de produção
```

## Segurança e privacidade

O projeto já inclui:

- cookie de autenticação HttpOnly, Secure em produção e com expiração;
- proteção CSRF em operações de escrita;
- senhas protegidas com bcrypt;
- tokens de confirmação e recuperação armazenados por hash e usados uma única vez;
- invalidação das sessões após alteração de senha;
- rate limit em cadastro, login e recuperação;
- consultas SQL parametrizadas e isolamento dos dados por usuário;
- validação de arquivos, tipos, identificadores e valores financeiros no servidor;
- proteção do histórico de faturas fechadas e pagas;
- CORS restrito e headers defensivos no frontend e na API;
- conexão TLS com validação do certificado do banco em produção.

Nunca envie arquivos `.env`, chaves SMTP, tokens ou credenciais para o repositório. Use apenas dados fictícios durante desenvolvimento e homologação.

As regras completas estão na [política de segurança](SECURITY.md). O comando abaixo verifica se nomes de arquivos ou assinaturas comuns de segredos foram incluídos por engano:

```bash
node scripts/check-secrets.js
```

Essa verificação também é executada automaticamente pelo GitHub em pushes e pull requests.

## Executando localmente

### Pré-requisitos

- Node.js 22 ou superior;
- PostgreSQL 17 ou uma instância compatível;
- npm.

### Backend

1. Copie `backend/.env.example` para `backend/.env`.
2. Preencha a conexão do banco e gere um `JWT_SECRET` com pelo menos 32 caracteres.
3. Instale, prepare o banco e inicie a API:

```bash
cd backend
npm install
npm run migrate
npm run dev
```

### Frontend

1. Copie `frontend/.env.example` para `frontend/.env.local` quando precisar alterar a URL da API.
2. Instale e inicie a interface:

```bash
cd frontend
npm install
npm run dev
```

Serviços locais:

- frontend: `http://localhost:3000`;
- API: `http://localhost:3001`;
- saúde da API: `http://localhost:3001/health`.

### Docker Compose

Preencha as variáveis necessárias e execute:

```bash
docker compose up --build
```

O ambiente sobe PostgreSQL, API e frontend. A API executa as migrações antes de iniciar.

## Qualidade e testes

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm run lint
npm run build
npm run test:e2e
```

Estado da última auditoria:

- **27 testes de backend** aprovados;
- **30 testes E2E** aprovados em desktop e mobile;
- lint, TypeScript e build de produção aprovados;
- nenhuma vulnerabilidade conhecida nas dependências de produção pelo `npm audit`.

Os documentos de [homologação](docs/HOMOLOGACAO.md), [feedback](docs/FEEDBACK_HOMOLOGACAO.md) e [auditoria final](docs/AUDITORIA_FINAL_2026-08-10.md) registram a evolução da qualidade do projeto.

## Roadmap

### Próximos passos para maturidade de produção

- CI/CD com lint, testes, build, auditoria e validação de migrações;
- monitoramento de erros, disponibilidade, latência e entrega de e-mails;
- backups automáticos com restauração testada;
- rate limit compartilhado entre instâncias;
- nova rodada ampliada de homologação em diferentes navegadores e aparelhos.

### Evoluções de produto

- arquivamento de cartões com preservação do histórico;
- avisos e preferências sincronizados entre dispositivos;
- exportação e importação completas dos dados;
- fechamento mensal guiado e conciliação financeira;
- armazenamento otimizado de avatares;
- autenticação em dois fatores ou passkeys;
- PWA com suporte offline;
- leitura assistida de comprovantes;
- projeções de fluxo de caixa baseadas em recorrências;
- avaliação futura de Open Finance com consentimento explícito e parceiro regulado.

## Status do projeto

O ListaWeb está em **homologação e amadurecimento**. Já funciona como produto utilizável, mas continua evoluindo a partir de auditorias técnicas e feedback de usuários reais.

O projeto é **100% gratuito**. Custos eventualmente cobrados por serviços externos de hospedagem, e-mail ou banco de dados não são controlados pelo ListaWeb.

## Autor

Desenvolvido por **Luan Oliveira** como projeto independente de produto, design e engenharia de software.

- [GitHub](https://github.com/luanoliveiralab)
- [Repositório do ListaWeb](https://github.com/luanoliveiralab/ListaWeb)

## Contribuições

Sugestões, relatos de bugs e melhorias são bem-vindos. Antes de contribuir:

1. não publique dados pessoais, financeiros ou credenciais;
2. abra uma issue descrevendo o problema ou a proposta;
3. crie uma branch específica para a alteração;
4. execute os testes e a verificação de segurança;
5. envie um pull request explicando o impacto da mudança.

Falhas de segurança devem seguir o processo privado descrito em [SECURITY.md](SECURITY.md), nunca uma issue pública.

## Licença

Distribuído sob a [Licença MIT](LICENSE). Você pode estudar, usar, modificar e distribuir o projeto respeitando os termos da licença.
