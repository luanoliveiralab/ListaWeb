# ListaWeb

![Licença MIT](https://img.shields.io/badge/licen%C3%A7a-MIT-2ea44f)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-19-149eca)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-336791)
![Testes](https://img.shields.io/badge/testes-62%20aprovados-success)
![Status](https://img.shields.io/badge/status-92%25%20para%20v1.0-blue)

O **ListaWeb** é uma aplicação pública, gratuita e de código aberto para organizar compras, finanças pessoais e planejamento em um único lugar.

O projeto nasceu para transformar tarefas financeiras cotidianas em uma experiência simples, visual e acessível, sem exigir planilhas complexas. O usuário mantém autonomia sobre suas movimentações, categorias, cartões, metas, orçamentos e preferências.

🔗 **Aplicação:** [listaweb.netlify.app](https://listaweb.netlify.app/)

> O ListaWeb não possui integração direta com bancos. As informações financeiras são cadastradas e controladas pelo próprio usuário.

## Funcionalidades

### Lista de compras

- criação, edição e exclusão de itens;
- categorias personalizadas;
- quantidade, valor e situação da compra;
- confirmação visual antes de excluir;
- escolha entre saldo e cartão de crédito ao concluir uma compra;
- criação automática da movimentação financeira correspondente.

### Finanças

- cadastro de receitas e despesas;
- escolha entre saldo e crédito;
- movimentações parceladas em até 24 vezes;
- filtros por tipo, categoria e descrição;
- edição e exclusão com confirmação visual;
- gráficos de distribuição e evolução financeira;
- atualização suave das informações;
- relatório financeiro em PDF com filtros, resumo e detalhamento;
- paginação A4 sem páginas vazias;
- identificação da origem da movimentação: receita, saldo ou cartão.

### Cartões e faturas

- cadastro de até quatro cartões;
- instituição selecionada por dropdown personalizado;
- identidade visual baseada na instituição;
- limite disponível e vencimento;
- crédito disponível no dashboard;
- abreviações das instituições, como `NU`, `BB` e `ITAÚ`;
- faturas mensais;
- fechamento e pagamento de faturas;
- histórico protegido de faturas fechadas ou pagas;
- associação de compras e despesas ao cartão utilizado.

### Planejamento

- orçamentos por categoria;
- alertas ao atingir percentuais relevantes do orçamento;
- metas financeiras;
- depósitos, retiradas e histórico das metas;
- receitas e despesas recorrentes;
- ativação, pausa e exclusão de recorrências;
- visualização por mês e ano.

### Categorias

- criação, edição e exclusão;
- categorias de receita ou despesa;
- escolha das páginas em que cada categoria estará disponível;
- aplicação independente em Lista de Compras, Finanças e Planejamento;
- preservação do histórico ao excluir uma categoria.

### Avisos e notificações

- notificações internas;
- central de avisos na barra lateral;
- filtros por situação;
- marcação como lida;
- alertas financeiros e de orçamento;
- layout responsivo para desktop e mobile.

### Conta e perfil

- cadastro com confirmação de e-mail opcional por configuração;
- validação de e-mail;
- recuperação e redefinição de senha;
- aceite obrigatório dos Termos de Uso e Privacidade;
- registro da data e versão dos termos aceitos;
- alteração de nome, e-mail e foto;
- confirmação antes de remover a foto;
- exclusão da conta com confirmação visual;
- avisos para informações repetidas ou não alteradas.

### Experiência e interface

- tema claro e escuro;
- dropdowns personalizados;
- interface responsiva;
- animações de aparição orientadas pela viewport;
- pausa de animações fora da tela ou com a aba em segundo plano;
- suporte à preferência de movimento reduzido;
- modais centralizados;
- cards deslizáveis no mobile;
- página pública Sobre;
- retorno inteligente da página Sobre para Login ou Configurações.

## Tecnologias

### Frontend

- **Next.js 16**;
- **React 19**;
- **TypeScript**;
- **Tailwind CSS 4**;
- **Base UI** e componentes inspirados no **shadcn/ui**;
- **TanStack Query** para cache e sincronização;
- **Recharts** para gráficos financeiros;
- **Lucide React** e **Font Awesome** para ícones;
- **Playwright** para jornadas automatizadas;
- **axe-core** para acessibilidade.

### Backend

- **Node.js 22**;
- **Express 5**;
- **PostgreSQL 17**;
- **JWT** armazenado em cookie HttpOnly;
- **bcrypt** para proteção das senhas;
- **Helmet** para headers defensivos;
- proteção **CSRF**;
- limitação de tentativas;
- consultas SQL parametrizadas;
- **Nodemailer/Brevo** para e-mails transacionais;
- migrações SQL versionadas;
- testes com o test runner nativo do Node.js.

### Infraestrutura

- frontend hospedado no **Netlify**;
- API preparada para **Render**;
- banco compatível com **Neon PostgreSQL**;
- envio de e-mails por SMTP/Brevo;
- suporte a ambiente local com **Docker Compose** e **Nginx**.

## Arquitetura

```text
Navegador
   |
   +-- Next.js / React
   |      Interface, cache, gráficos e experiência do usuário
   |
   +-- API Express
          Autenticação, validações e regras de negócio
             |
             +-- PostgreSQL
             |      Usuários, compras e informações financeiras
             |
             +-- Brevo / SMTP
                    Verificação de e-mail e recuperação de conta
```

```text
ListaWeb/
├── frontend/            Interface, páginas, componentes e testes E2E
├── backend/             API, segurança, regras de negócio e testes
│   ├── migrations/      Estrutura e evolução do PostgreSQL
│   ├── scripts/         Migrações, backup e verificações auxiliares
│   ├── src/             Módulos internos da aplicação
│   └── tests/           Testes automatizados do backend
├── docs/                Homologação, feedbacks e auditorias
├── docker-compose.yml   Ambiente completo para desenvolvimento
└── netlify.toml         Build, proxy e headers de produção
```

## Segurança e privacidade

O ListaWeb inclui:

- autenticação por cookie HttpOnly;
- cookie `Secure` em produção;
- proteção CSRF nas operações de escrita;
- senhas protegidas com bcrypt;
- tokens de confirmação e recuperação armazenados por hash;
- tokens de uso único e com expiração;
- invalidação de sessões após alteração de senha;
- limitação de tentativas em cadastro, login e recuperação;
- consultas SQL parametrizadas;
- separação dos registros por usuário;
- validação de tipos, identificadores e valores no servidor;
- validação de imagens e limite de tamanho;
- CORS restrito;
- headers defensivos no frontend e na API;
- conexão TLS com validação do certificado do banco em produção;
- registro da versão dos termos aceita durante o cadastro;
- varredura de arquivos e assinaturas comuns de segredos.

Nunca envie arquivos `.env`, chaves SMTP, tokens, credenciais ou dados pessoais para o repositório.

Use somente os arquivos `.env.example` como referência e mantenha os valores reais nas configurações privadas dos serviços de hospedagem.

As regras completas estão disponíveis na [Política de Segurança](SECURITY.md).

Para procurar arquivos ou padrões comuns de credenciais:

```bash
node scripts/check-secrets.js
```

A verificação também pode ser executada automaticamente em pushes e pull requests.

## Executando localmente

### Pré-requisitos

- Node.js 22 ou superior;
- PostgreSQL 17 ou serviço compatível;
- npm.

### Backend

1. Copie `backend/.env.example` para `backend/.env`.
2. Configure a conexão com o banco.
3. Gere um `JWT_SECRET` seguro, com pelo menos 32 caracteres.
4. Instale as dependências e prepare o banco:

```bash
cd backend
npm install
npm run migrate
npm run dev
```

### Frontend

1. Copie `frontend/.env.example` para `frontend/.env.local` caso precise alterar a URL da API.
2. Instale as dependências e inicie o frontend:

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

Configure as variáveis necessárias e execute:

```bash
docker compose up --build
```

O ambiente inicia PostgreSQL, API e frontend. A API executa as migrações antes de começar a receber requisições.

## Qualidade e testes

### Backend

```bash
cd backend
npm test
npm audit --omit=dev
```

### Frontend

```bash
cd frontend
npm run lint
npm run build
npm run test:e2e
npm audit --omit=dev
```

Estado do último checkup:

- **27 testes de backend aprovados**;
- **35 jornadas E2E aprovadas**;
- testes executados em desktop e mobile;
- teste dedicado para geração de PDF sem páginas vazias;
- lint aprovado;
- TypeScript aprovado;
- build de produção aprovado;
- verificações de acessibilidade aprovadas;
- nenhuma vulnerabilidade conhecida nas dependências de produção;
- nenhuma credencial real rastreada no repositório;
- nenhum marcador `TODO` ou `FIXME` pendente.

Os documentos de [homologação](docs/HOMOLOGACAO.md), [feedback](docs/FEEDBACK_HOMOLOGACAO.md) e [auditoria final](docs/AUDITORIA_FINAL_2026-08-10.md) registram a evolução do projeto.

## Roadmap

### Próximos passos para a versão 1.0

- ampliar a homologação com usuários reais;
- testar em mais navegadores e aparelhos físicos;
- configurar monitoramento contínuo de erros e desempenho;
- testar formalmente backup e restauração;
- realizar revisão jurídica dos Termos de Uso e Privacidade;
- preparar a publicação da versão `v1.0.0`.

### Evoluções futuras

- arquivamento de cartões com preservação do histórico;
- sincronização completa das preferências entre dispositivos;
- exportação e importação dos dados do usuário;
- fechamento mensal guiado;
- conciliação financeira;
- armazenamento otimizado de avatares;
- autenticação em dois fatores ou passkeys;
- PWA com suporte offline;
- leitura assistida de comprovantes;
- projeções de fluxo de caixa;
- relatórios financeiros personalizáveis;
- avaliação futura de Open Finance por meio de parceiro regulado e consentimento explícito.

## Status do projeto

O ListaWeb está em aproximadamente **92% de avanço para uma versão 1.0 estável**.

As funcionalidades principais estão implementadas e o aplicativo já pode ser utilizado. O trabalho restante está concentrado em maturidade operacional, monitoramento, testes ampliados e revisão jurídica.

O projeto é **100% gratuito para seus usuários**.

Serviços externos de hospedagem, banco de dados ou envio de e-mails podem gerar custos para quem realizar uma instalação própria.

## Autor

Desenvolvido por **Luan Oliveira** como um projeto independente de produto, design e engenharia de software.

- [GitHub](https://github.com/luanoliveiralab)
- [LinkedIn](https://www.linkedin.com/in/luanoliveira-ld)
- [YouTube](https://www.youtube.com/@dev_lso)
- [Repositório do ListaWeb](https://github.com/luanoliveiralab/ListaWeb)

## Contribuições

Sugestões, relatos de bugs e melhorias são bem-vindos.

Antes de contribuir:

1. não publique dados pessoais, financeiros ou credenciais;
2. abra uma issue descrevendo o problema ou a proposta;
3. crie uma branch específica para a alteração;
4. execute lint, testes e build;
5. execute a verificação de segurança;
6. envie um pull request explicando o impacto da mudança.

Falhas de segurança devem seguir o processo privado descrito em [SECURITY.md](SECURITY.md). Não abra uma issue pública contendo detalhes sensíveis.

## Aviso

O ListaWeb é uma ferramenta de organização pessoal. Ele não é uma instituição financeira, não movimenta dinheiro e não oferece aconselhamento financeiro profissional.

As informações exibidas dependem dos dados cadastrados pelo próprio usuário.

## Licença

Distribuído sob a [Licença MIT](LICENSE).

Você pode estudar, utilizar, modificar e distribuir o projeto respeitando os termos da licença.
