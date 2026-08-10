# Auditoria final do ListaWeb

Data: 10 de agosto de 2026

## Resultado executivo

O projeto está apto para continuar a homologação. Não foram encontradas vulnerabilidades conhecidas nas dependências de produção do frontend ou do backend. A autenticação usa cookie HttpOnly, proteção CSRF, expiração de sessão, invalidação por versão, hash bcrypt e tokens de e-mail armazenados por hash e de uso único.

Nesta auditoria foram corrigidos os riscos comprovados abaixo:

- lançamentos de faturas fechadas ou pagas não podem mais ser editados ou excluídos;
- movimentos que representam o pagamento de uma fatura ficaram imutáveis;
- cartões com faturas ou movimentações não podem ser apagados e quebrar o histórico;
- operações concorrentes de cartão e fatura agora usam bloqueios transacionais coerentes;
- upload de avatar passou a validar formato, Base64 real e tamanho também no servidor;
- erros assíncronos no upload agora chegam ao usuário por toast;
- flags de aplicação de categorias rejeitam valores ambíguos em vez de convertê-los silenciosamente;
- formas de pagamento desconhecidas são rejeitadas pela API;
- links de recuperação usam apenas a origem principal quando existem vários domínios permitidos;
- produção exige segredo JWT com pelo menos 32 caracteres;
- conexão TLS com PostgreSQL valida o certificado por padrão;
- Netlify e a imagem Docker estática receberam headers defensivos;
- os containers foram alinhados ao modo real de execução: migrações antes da API e frontend exportado servido pelo Nginx.

## Verificações concluídas

- segredos e arquivos `.env`: nenhum segredo rastreado pelo Git;
- dependências de produção: 0 alertas no `npm audit` em ambos os pacotes;
- backend: 27 testes aprovados;
- frontend: lint, TypeScript e build de produção aprovados;
- jornadas: 30 testes E2E aprovados em desktop e mobile, incluindo acessibilidade;
- isolamento de dados: rotas sensíveis verificam o usuário autenticado e usam consultas parametrizadas;
- e-mails: conteúdo dinâmico é escapado e tokens não são gravados em texto puro no banco.

## Riscos aceitos e limitações atuais

1. A recuperação de senha informa quando um e-mail não existe. Isso atende à decisão de produto atual, mas permite enumeração de contas. A recomendação de segurança é voltar para uma resposta genérica quando houver maior exposição pública.
2. O limitador de tentativas vive em memória. Ele funciona em uma instância, mas não é compartilhado entre réplicas e zera em reinícios.
3. Avisos lidos e marcos já exibidos ficam no navegador; não sincronizam entre dispositivos.
4. Fotos ainda ficam como Base64 no PostgreSQL e no cache local. Funciona na escala atual, porém armazenamento de objetos será mais econômico e rápido.
5. A API principal ainda está concentrada em um arquivo grande, o que eleva o custo de manutenção e de testes unitários.
6. Não há integração bancária. Toda informação financeira é declarada pelo usuário.

## Roadmap recomendado

### Agora — confiança operacional

- configurar backups automáticos do PostgreSQL e testar restauração mensalmente;
- adicionar CI com lint, testes, build, auditoria de dependências e verificação de migrações a cada mudança;
- centralizar rate limit em Redis ou no provedor de borda;
- monitorar erros por `requestId`, disponibilidade, latência e falhas de envio de e-mail;
- criar testes de integração financeira em banco isolado para fechamento, pagamento e concorrência de faturas.

### Próxima fase — produto mais sólido

- adicionar arquivamento de cartão, preservando histórico sem mantê-lo entre cartões ativos;
- persistir avisos e preferências no backend, com sincronização entre dispositivos;
- criar fechamento mensal guiado, conciliação de saldo e relatório de divergências;
- permitir exportação completa dos dados do usuário em JSON/PDF e importação com validação;
- mover avatares para armazenamento de objetos com redimensionamento e remoção de metadados;
- separar a API por domínios (`usuarios`, `listas`, `movimentacoes`, `orcamentos`) e padronizar erros.

### Evolução — diferenciação

- autenticação em dois fatores ou passkeys;
- PWA com modo offline e sincronização segura;
- metas colaborativas e compartilhamento opcional de listas;
- leitura de comprovantes com confirmação humana antes de criar lançamentos;
- previsões de fluxo de caixa baseadas em recorrências, sem tratar estimativas como valores reais;
- integração com Open Finance somente após análise jurídica, consentimento explícito, criptografia de credenciais e parceiro regulado.

## Critério de liberação

Antes de ampliar o público, devem estar concluídos: backup com restauração testada, observabilidade, rate limit compartilhado e uma política de privacidade coerente com os dados financeiros armazenados. Os demais itens podem evoluir de forma incremental.
