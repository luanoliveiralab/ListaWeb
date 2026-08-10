# Feedback de homologação — ListaWeb

Não inclua senhas, dados bancários ou informações financeiras reais.

## Contexto

- Nome ou apelido:
- Celular ou computador:
- Navegador:
- Data e horário:
- Cenário testado (ex.: H09):

## O que aconteceu?

- O que você tentou fazer?
- O que esperava que acontecesse?
- O que aconteceu de fato?
- Conseguiu continuar de outra maneira?

## Evidência

- Mensagem apresentada:
- Captura de tela ou gravação, se possível:

## Percepção

- Gravidade percebida: bloqueador / alto / médio / baixo
- A tela estava clara? sim / parcialmente / não
- De 0 a 10, quão fácil foi concluir a tarefa?
- O que você mudaria primeiro?

## Feedbacks recebidos

### F01 — Layout e experiência geral — 10/08/2026

- Testador: identificado internamente como Testador 1.
- Dispositivo e navegador: não informados.
- Percepção: layout aprovado; destaque positivo para o sistema de temas claro e escuro.
- Classificação: elogio, sem correção necessária.

### F02 — Recuperação de senha — 10/08/2026

- Testador: identificado internamente como Testador 2.
- Cenário relacionado: H02.
- Evidência: recebimento do e-mail de redefinição de senha confirmado pelo testador.
- Resultado: aprovado nesta etapa; ainda é necessário confirmar, na rodada completa, a abertura do link e a definição da nova senha.
- Classificação: sem problema relatado.

### F03 — Alertas de orçamento por categoria — 10/08/2026

- Testador: identificado internamente como Testador 3.
- Percepção: aplicativo considerado completo e funcional, com destaque positivo para Finanças e Metas.
- Sugestão: avisar quando o consumo de uma categoria alcançar percentuais relevantes do orçamento, por exemplo: “Você já utilizou 80% do orçamento de Mercado”.
- Classificação: melhoria de produto; prioridade sugerida: média.
- Critério inicial recomendado: avisos únicos em 50%, 80% e 100%, exibidos dentro do aplicativo, sem notificações externas nesta primeira versão.
- Situação: implementado em 10/08/2026 nas páginas Finanças e Planejamento, com persistência dos marcos no dispositivo e presença contínua no centro de notificações.

### F04 — Caixa de notificações fora da tela no mobile — 10/08/2026

- Classificação: bug visual de prioridade baixa.
- Situação: corrigido; painel alinhado à viewport e protegido por teste em desktop e mobile.

### F05 — Central completa de avisos — 10/08/2026

- Sugestão: disponibilizar uma página de avisos na navegação além do acesso rápido pelo sino.
- Classificação: melhoria de produto.
- Situação: implementado em `/avisos`, com filtros, contador, leitura sincronizada e atalhos.

### F06 — Indicador do sino piscando entre páginas — 10/08/2026

- Classificação: bug visual de prioridade baixa.
- Situação: corrigido; o estado de leitura agora é recuperado antes da primeira renderização da barra.

### F07 — Forma de pagamento ao concluir item — 10/08/2026

- Sugestão: perguntar se o item foi pago com saldo ou cartão ao marcá-lo como comprado.
- Classificação: melhoria funcional de prioridade alta para o próximo ciclo.
- Situação: implementado em 10/08/2026, com escolha entre saldo e crédito, seleção de cartão e cancelamento sem concluir o item.

### F08 — Identidade visual dos e-mails — 10/08/2026

- Sugestão: aplicar um template responsivo e alinhado à marca aos e-mails enviados pela API.
- Classificação: melhoria de experiência de prioridade média.
- Situação: implementado em 10/08/2026 para confirmação de cadastro e redefinição de senha, com HTML responsivo e versão em texto simples.

### F09 — Categorias disponíveis por página — 10/08/2026

- Sugestão: permitir escolher se cada categoria aparece em Lista, Finanças e/ou Planejamento.
- Classificação: melhoria de autonomia de prioridade média-alta.
- Situação: backlog.
