# Homologação do ListaWeb

## Rodada 1 — Fluxos essenciais

Objetivo: validar se uma pessoa consegue começar e concluir as tarefas principais sem ajuda técnica.

Ambiente: [listaweb.netlify.app](https://listaweb.netlify.app/)

### Regras para os testadores

- Use uma conta de teste e dados fictícios. Não informe números reais de cartão, senhas bancárias ou documentos.
- Execute os cenários no celular ou computador que utiliza normalmente.
- Registre o que esperava que acontecesse quando algo parecer confuso.
- Não é necessário testar conexão bancária: o ListaWeb não possui essa integração.

## Cenários obrigatórios

Marque cada cenário como `Aprovado`, `Falhou` ou `Precisa melhorar`.

| ID | Área | Cenário | Resultado esperado |
|---|---|---|---|
| H01 | Conta | Criar conta e confirmar o e-mail | A conta é ativada e permite login |
| H02 | Conta | Recuperar a senha | O link recebido permite definir uma nova senha |
| H03 | Perfil | Alterar nome e e-mail | A confirmação aparece e os novos dados são salvos |
| H04 | Perfil | Tentar salvar nome ou e-mail atuais | Um aviso específico é exibido sem salvar novamente |
| H05 | Perfil | Adicionar e remover foto | A remoção exige confirmação visual |
| H06 | Categorias | Criar, editar e excluir categoria | A opção aparece em todas as páginas e o histórico é preservado |
| H07 | Lista | Criar, editar, concluir e excluir item | A lista atualiza imediatamente e a exclusão pede confirmação |
| H08 | Finanças | Criar receita e despesa pelo saldo | Dashboard e saldo refletem os lançamentos |
| H09 | Cartões | Cadastrar cartão e lançar compra no crédito | Limite e fatura são atualizados |
| H10 | Faturas | Fechar e pagar fatura | Ambas as ações exigem confirmação e o pagamento reduz o saldo |
| H11 | Planejamento | Criar orçamento e recorrência | Os dados aparecem no período selecionado |
| H12 | Metas | Criar meta e movimentar valores | Progresso e histórico são atualizados |
| H13 | Responsividade | Repetir H07, H09 e H12 no celular | Não há conteúdo cortado nem rolagem indevida |
| H14 | Conta | Excluir conta de teste | A confirmação explica a perda e encerra o acesso |

## Classificação de problemas

- `Bloqueador`: impede cadastro, login, recuperação de senha ou acesso aos dados.
- `Alto`: causa perda, duplicação ou cálculo financeiro incorreto.
- `Médio`: uma função falha, mas existe alternativa para continuar.
- `Baixo`: texto, alinhamento, fluidez ou comportamento visual sem perda de função.

## Critérios para aprovar a rodada

- Nenhum problema bloqueador ou alto aberto.
- H01, H02, H07, H08, H09, H10 e H14 aprovados por todos os testadores.
- Pelo menos 90% dos demais cenários aprovados.
- Nenhum dado de uma conta aparece em outra conta.
- Fluxos essenciais aprovados em pelo menos um celular e um computador.

## Registro da rodada

| Testador | Dispositivo | Navegador | Início | Conclusão | Resultado geral |
|---|---|---|---|---|---|
|  |  |  |  |  |  |

## Validação técnica — 10/08/2026

Enquanto os testadores convidados não estavam disponíveis, foi executada a etapa técnica da primeira rodada:

- produção e comunicação com o banco verificadas;
- 19 testes do servidor aprovados;
- 20 jornadas de interface aprovadas em desktop e mobile;
- navegação por teclado e fechamento de confirmações com `Esc` aprovados;
- nenhuma violação de acessibilidade grave ou crítica nas telas auditadas;
- nomes acessíveis adicionados ao botão de tema, seletor de período e controle de modo escuro;
- contraste do valor positivo no histórico aprimorado.

Resultado: **etapa técnica aprovada**.

## Encerramento da rodada — 10/08/2026

### Evidências consolidadas

- 19 testes do servidor aprovados;
- 26 jornadas de interface aprovadas em desktop e mobile;
- build de produção e auditoria de acessibilidade aprovados;
- recebimento do e-mail de redefinição confirmado por uma testadora;
- avaliações humanas positivas sobre layout, temas, Finanças, Metas e utilidade geral;
- dois bugs visuais de notificações encontrados pelos testadores e corrigidos;
- nenhum problema bloqueador ou de prioridade alta permaneceu aberto.

### Decisão

**Rodada 1 encerrada e aprovada para beta público, com ressalvas.**

O produto pode continuar disponível para uso e coleta de feedback. Ele ainda não deve ser classificado como versão final estável porque não houve registro individual completo dos cenários H01 a H14 por todos os convidados. Essa ausência é uma limitação de evidência, não um bug confirmado.

### Próximo ciclo

1. Perguntar se a compra concluída na lista foi paga com saldo ou cartão.
2. Aplicar identidade visual responsiva aos e-mails transacionais.
3. Permitir definir em quais páginas cada categoria estará disponível.
4. Reexecutar apenas os cenários afetados e os testes de regressão.
