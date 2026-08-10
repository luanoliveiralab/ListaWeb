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

- cadastro com verificação de e-mail;
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
- retor
