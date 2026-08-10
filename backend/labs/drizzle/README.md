# Protótipo Drizzle ORM

Este laboratório declara somente `usuarios`, `cartoes` e `faturas_cartao`. Ele não executa migrações, não altera o PostgreSQL e não participa do servidor de produção.

## Resultado

Pontos favoráveis:

- As consultas continuam próximas de SQL e geram parâmetros separados dos valores.
- Colunas são listadas explicitamente e renomes no esquema se propagam às consultas.
- O modo simulado permite verificar o SQL sem conexão real.

Pontos de atenção:

- O backend é CommonJS/JavaScript; a inferência de tipos do Drizzle só entregaria seu valor completo após migração gradual para TypeScript.
- As consultas financeiras atuais usam CTEs, agregações e regras PostgreSQL específicas. Drizzle aceita SQL personalizado, mas isso reduziria o ganho sobre `pg` em parte do sistema.
- Adotar o gerador de migrações agora criaria duas fontes de verdade, pois `migrations/001_initial.sql` já é responsável pelo esquema.

## Recomendação

Não migrar o backend inteiro neste momento. Se o projeto adotar TypeScript, usar Drizzle primeiro em um módulo novo e sem consultas analíticas complexas. Manter `pg` e as migrações SQL atuais como fonte oficial até lá.
