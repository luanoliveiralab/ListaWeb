"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import AppLayout from "@/components/layout/AppLayout";
import FinanceCards from "@/components/financas/FinanceCards";
import AddMovimentacaoForm from "@/components/financas/AddMovimentacaoForm";
import ScheduledMovementsPanel from "@/components/financas/ScheduledMovementsPanel";
import FinanceTable from "@/components/financas/FinanceTable";

import { useUsuario } from "@/hooks/useUsuario";
import { financasService } from "@/services/financas.service";

import type { Movimentacao } from "@/types/Movimentacao";

import EditMovimentacaoModal from "@/components/financas/EditMovimentacaoModal";

import FinancePieChart from "@/components/financas/FinancePieChart";

import FinanceLineChart from "@/components/financas/FinanceLineChart";

import PeriodSelector from "@/components/shared/PeriodSelector";

import { usePeriod } from "@/context/PeriodContext";
import { useToast } from "@/providers/ToastProvider";
import { planejamentoService } from "@/services/planejamento.service";
import CreditCardsPanel from "@/components/financas/CreditCardsPanel";
import { cartoesService } from "@/services/cartoes.service";
import type { Cartao } from "@/types/Cartao";
import ConfirmationDialog from "@/components/shared/ConfirmationDialog";
import type { Orcamento } from "@/types/Orcamento";
import { orcamentosService } from "@/services/orcamentos.service";
import { useBudgetThresholdAlerts } from "@/hooks/useBudgetThresholdAlerts";
import type { Recorrencia } from "@/types/Planejamento";
import AppSelect from "@/components/shared/AppSelect";
import FinancialAgenda from "@/components/financas/FinancialAgenda";
import { hojeEmSaoPaulo } from "@/lib/date";

interface MovimentacaoProgramada {
    id: number;
    usuario_id: number;
    tipo: "receita" | "despesa";
    descricao: string;
    valor: number;
    categoria: string;
    data_programada: string;
    forma_pagamento: "saldo" | "credito";
    cartao_id?: number | null;
    cartao_nome?: string | null;
    created_at: string;
    status?: "pendente" | "realizada" | "falha";
    erro?: string | null;
    origem?: "programacao" | "recorrencia";
    recorrencia_id?: number | null;
}

export default function FinancasPage() {
    const { usuario } = useUsuario();
    const { mostrarAviso } = useToast();
    const queryClient = useQueryClient();

    const [categoriaSelecionada, setCategoriaSelecionada] = useState("");
    const [modalAberto, setModalAberto] = useState(false);

    const [movimentacaoEditando, setMovimentacaoEditando] =
        useState<Movimentacao | null>(null);

    const [movimentacaoExcluir, setMovimentacaoExcluir] =
        useState<Movimentacao | null>(null);

    const [excluindoMovimentacao, setExcluindoMovimentacao] = useState(false);
    const [escopoExclusao, setEscopoExclusao] = useState<"esta" | "proximas" | "todas">("esta");

    const [tipo, setTipo] = useState<"receita" | "despesa">("receita");
    const [descricao, setDescricao] = useState("");
    const [valor, setValor] = useState("");
    const [categoria, setCategoria] = useState("");
    const [formaPagamento, setFormaPagamento] = useState<"saldo" | "credito">("saldo");
    const [cartaoId, setCartaoId] = useState("");
    const [parcelas, setParcelas] = useState("1");
    const [data, setData] = useState(
        hojeEmSaoPaulo()
    );

    const {
        mes,
        ano,
        setMes,
        setAno,
    } = usePeriod();

    const movimentacoesKey = ["financas", usuario?.id, ano, mes] as const;
    const historicoKey = ["financas-historico", usuario?.id] as const;
    const cartoesKey = ["cartoes", usuario?.id] as const;
    const programadasKey = ["movimentacoes-programadas", usuario?.id] as const;
    const recorrenciasKey = ["recorrencias", usuario?.id] as const;
    const orcamentosKey = ["orcamentos", usuario?.id, ano, mes] as const;
    const movimentacoesQuery = useQuery<Movimentacao[]>({
        queryKey: movimentacoesKey,
        queryFn: async () => (await planejamentoService.gerarRecorrencias(mes, ano)).movimentacoes,
        enabled: Boolean(usuario?.id),
    });
    const cartoesQuery = useQuery<Cartao[]>({
        queryKey: cartoesKey,
        queryFn: cartoesService.listar,
        enabled: Boolean(usuario?.id),
    });
    const historicoQuery = useQuery<Movimentacao[]>({
        queryKey: historicoKey,
        queryFn: () => financasService.buscarPorUsuario(usuario!.id),
        enabled: Boolean(usuario?.id),
    });
    const programadasQuery = useQuery<MovimentacaoProgramada[]>({
        queryKey: programadasKey,
        queryFn: async () => (await financasService.buscarProgramadas()) as MovimentacaoProgramada[],
        enabled: Boolean(usuario?.id),
    });
    const recorrenciasQuery = useQuery<Recorrencia[]>({
        queryKey: recorrenciasKey,
        queryFn: planejamentoService.buscarRecorrencias,
        enabled: Boolean(usuario?.id),
    });
    const orcamentosQuery = useQuery<Orcamento[]>({
        queryKey: orcamentosKey,
        queryFn: () => orcamentosService.buscar(usuario!.id, mes, ano),
        enabled: Boolean(usuario?.id),
    });
    const movimentacoes = movimentacoesQuery.data ?? [];
    const historicoMovimentacoes = historicoQuery.data ?? [];
    const cartoes = cartoesQuery.data ?? [];
    const programadas = programadasQuery.data ?? [];
    const recorrencias = recorrenciasQuery.data ?? [];
    const orcamentos = orcamentosQuery.data ?? [];
    const loading = movimentacoesQuery.isPending;
    const carregandoCartoes = cartoesQuery.isPending;

    useBudgetThresholdAlerts({
        usuarioId: usuario?.id,
        mes,
        ano,
        orcamentos,
        movimentacoes,
        carregado: orcamentosQuery.isFetched && movimentacoesQuery.isFetched,
    });

    useEffect(() => {
        if (cartoesQuery.error) mostrarAviso("Não foi possível carregar os cartões.", "erro");
    }, [cartoesQuery.error, mostrarAviso]);

    function atualizarMovimentacoes(atualizar: (atuais: Movimentacao[]) => Movimentacao[]) {
        queryClient.setQueryData<Movimentacao[]>(movimentacoesKey, (atuais = []) => atualizar(atuais));
    }

    function atualizarCartoes(atualizar: (atuais: Cartao[]) => Cartao[]) {
        queryClient.setQueryData<Cartao[]>(cartoesKey, (atuais = []) => atualizar(atuais));
    }

    function atualizarDashboard() {
        queryClient.invalidateQueries({ queryKey: ["dashboard", usuario?.id] });
    }

    async function adicionarCartao(dados: {
        nome: string;
        instituicao: string;
        limite_disponivel: number;
        dia_vencimento: number;
        dia_fechamento?: number;
    }) {
        const temporario: Cartao = {
            id: -Date.now(),
            usuario_id: usuario?.id ?? 0,
            ...dados,
            created_at: new Date().toISOString(),
        };
        atualizarCartoes((atuais) => [temporario, ...atuais]);
        try {
            const novo = await cartoesService.adicionar(dados);
            atualizarCartoes((atuais) => atuais.map((cartao) => cartao.id === temporario.id ? novo : cartao));
            atualizarDashboard();
            mostrarAviso("Cartão adicionado com sucesso!");
        } catch (err) {
            atualizarCartoes((atuais) => atuais.filter((cartao) => cartao.id !== temporario.id));
            console.error(err);
            mostrarAviso("Não foi possível adicionar o cartão.", "erro");
            throw err;
        }
    }

    async function removerCartao(id: number) {
        const removido = cartoes.find((cartao) => cartao.id === id);
        atualizarCartoes((atuais) => atuais.filter((cartao) => cartao.id !== id));
        try {
            await cartoesService.remover(id);
            atualizarDashboard();
            mostrarAviso("Cartão removido.");
        } catch (err) {
            if (removido) atualizarCartoes((atuais) => [removido, ...atuais]);
            console.error(err);
            mostrarAviso("Não foi possível remover o cartão.", "erro");
        }
    }

    // =========================
    // ADICIONAR
    // =========================
    async function adicionarMovimentacao() {
        if (!usuario) return false;
        const valorNumero = Number(valor.replace(",", "."));

        if (!descricao || isNaN(valorNumero) || valorNumero <= 0 || !categoria) {
            mostrarAviso("Preencha todos os campos.", "erro");
            return false;
        }

        if (tipo === "despesa" && formaPagamento === "credito" && !cartaoId) {
            mostrarAviso("Selecione o cartão utilizado.", "erro");
            return false;
        }

        const formaFinal = tipo === "despesa" ? formaPagamento : "saldo";
        const cartaoFinal = tipo === "despesa" && formaPagamento === "credito" ? Number(cartaoId) : null;
        const temporaria: Movimentacao = {
            id: -Date.now(),
            usuario_id: usuario.id,
            tipo,
            descricao: descricao.trim(),
            valor: valorNumero,
            categoria,
            data,
            created_at: new Date().toISOString(),
            forma_pagamento: formaFinal,
            cartao_id: cartaoFinal,
            cartao_nome: cartaoFinal ? cartoes.find((cartao) => cartao.id === cartaoFinal)?.nome ?? null : null,
        };
        atualizarMovimentacoes((prev) => [temporaria, ...prev]);
        setTipo("receita");
        setDescricao("");
        setValor("");
        setCategoria("");
        setFormaPagamento("saldo");
        setCartaoId("");
        setParcelas("1");
        setData(hojeEmSaoPaulo());

        try {
            const nova = await financasService.adicionar({
                usuario_id: usuario.id,
                tipo,
                descricao,
                valor: valorNumero,
                categoria,
                data,
                forma_pagamento: formaFinal,
                cartao_id: cartaoFinal,
                parcelas: Number(parcelas),
            });

            const novas = "movimentacoes" in nova ? nova.movimentacoes : [nova];
            atualizarMovimentacoes((prev) => [...novas, ...prev.filter((mov) => mov.id !== temporaria.id)]);
            atualizarDashboard();

            mostrarAviso("Movimentação adicionada com sucesso!");
            return true;
        } catch (err) {
            atualizarMovimentacoes((prev) => prev.filter((mov) => mov.id !== temporaria.id));
            console.error(err);
            mostrarAviso("Erro ao adicionar movimentação.", "erro");
            return false;
        }
    }

    // =========================
    // EXCLUIR
    // =========================

    function abrirModalExcluir(movimentacao: Movimentacao) {
        setEscopoExclusao("esta");
        setMovimentacaoExcluir(movimentacao);
    }

    async function confirmarExclusaoMovimentacao() {
        if (!movimentacaoExcluir) return;
        setExcluindoMovimentacao(true);
        try {
            if (movimentacaoExcluir.pendente && movimentacaoExcluir.programada_id) {
                await financasService.cancelarProgramacao(movimentacaoExcluir.programada_id);
                queryClient.invalidateQueries({ queryKey: programadasKey });
                mostrarAviso("Movimentação programada cancelada.");
            } else {
                await excluirMovimentacao(movimentacaoExcluir.id, movimentacaoExcluir.grupo_parcelamento ? escopoExclusao : "esta");
            }
            setMovimentacaoExcluir(null);
        }
        finally { setExcluindoMovimentacao(false); }
    }

    async function editarCartao(id: number, dados: {
        nome: string; instituicao: string; limite_disponivel: number; dia_vencimento: number; dia_fechamento?: number;
    }) {
        const anterior = cartoes.find((cartao) => cartao.id === id);
        atualizarCartoes((atuais) => atuais.map((cartao) => cartao.id === id ? { ...cartao, ...dados } : cartao));
        try {
            const atualizado = await cartoesService.editar(id, dados);
            atualizarCartoes((atuais) => atuais.map((cartao) => cartao.id === id ? atualizado : cartao));
            atualizarDashboard();
            mostrarAviso("Cartão atualizado.");
        } catch (error) {
            if (anterior) atualizarCartoes((atuais) => atuais.map((cartao) => cartao.id === id ? anterior : cartao));
            mostrarAviso(error instanceof Error ? error.message : "Não foi possível atualizar o cartão.", "erro");
            throw error;
        }
    }

    async function excluirMovimentacao(id: number, escopo: "esta" | "proximas" | "todas" = "esta") {
        const removida = movimentacoes.find((mov) => mov.id === id);
        if (escopo === "esta") atualizarMovimentacoes((prev) => prev.filter((mov) => mov.id !== id));
        try {
            await financasService.remover(id, escopo);
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: movimentacoesKey }),
                queryClient.invalidateQueries({ queryKey: historicoKey }),
            ]);
            atualizarDashboard();
            mostrarAviso(escopo === "esta" ? "Movimentação excluída com sucesso!" : "Parcelas selecionadas excluídas com sucesso!");
        } catch (err) {
            if (escopo === "esta" && removida) atualizarMovimentacoes((prev) => [removida, ...prev]);
            console.error(err);
            mostrarAviso("Erro ao excluir movimentação.", "erro");
        }
    }

    // =========================
    // EDITAR
    // =========================
    async function salvarEdicao(mov: Movimentacao) {
        if (mov.programada_id) {
            setModalAberto(false);
            setMovimentacaoEditando(null);
            try {
                await financasService.editarProgramacao(mov.programada_id, {
                    tipo: mov.tipo, descricao: mov.descricao, valor: Number(mov.valor), categoria: mov.categoria,
                    data: mov.data, forma_pagamento: mov.forma_pagamento ?? "saldo", cartao_id: mov.cartao_id ?? null,
                });
                await queryClient.invalidateQueries({ queryKey: programadasKey });
                mostrarAviso("Programação atualizada.");
            } catch (error) { mostrarAviso(error instanceof Error ? error.message : "Não foi possível atualizar a programação.", "erro"); }
            return;
        }
        const anterior = movimentacoes.find((item) => item.id === mov.id);
        atualizarMovimentacoes((prev) => prev.map((item) => item.id === mov.id ? mov : item));
        setModalAberto(false);
        setMovimentacaoEditando(null);
        try {
            const atualizada = await financasService.atualizar(mov.id, {
                tipo: mov.tipo,
                descricao: mov.descricao,
                valor: mov.valor,
                categoria: mov.categoria,
                data: mov.data,
                forma_pagamento: mov.forma_pagamento ?? "saldo",
                cartao_id: mov.cartao_id ?? null,
                escopo_parcelamento: mov.escopo_parcelamento,
            });

            atualizarMovimentacoes((prev) =>
                prev.map((m) =>
                    m.id === atualizada.id ? atualizada : m
                )
            );
            if (mov.grupo_parcelamento && mov.escopo_parcelamento !== "esta") {
                await Promise.all([
                    queryClient.invalidateQueries({ queryKey: movimentacoesKey }),
                    queryClient.invalidateQueries({ queryKey: historicoKey }),
                ]);
            }
            atualizarDashboard();

            mostrarAviso("Movimentação atualizada com sucesso!");
        } catch (err) {
            if (anterior) atualizarMovimentacoes((prev) => prev.map((item) => item.id === anterior.id ? anterior : item));
            console.error(err);
            mostrarAviso("Erro ao atualizar movimentação.", "erro");
        }
    }

    function editarMovimentacao(mov: Movimentacao) {
        setMovimentacaoEditando(mov);
        setModalAberto(true);
    }

    async function alternarConciliacao(movimentacao: Movimentacao) {
        const conciliada = !movimentacao.conciliada;
        atualizarMovimentacoes((atuais) => atuais.map((item) => item.id === movimentacao.id ? { ...item, conciliada } : item));
        try {
            await financasService.conciliar(movimentacao.id, conciliada);
            mostrarAviso(conciliada ? "Movimentação marcada como conferida." : "Conferência removida.");
        } catch (error) {
            atualizarMovimentacoes((atuais) => atuais.map((item) => item.id === movimentacao.id ? movimentacao : item));
            mostrarAviso(error instanceof Error ? error.message : "Não foi possível atualizar a conferência.", "erro");
        }
    }

    if (!usuario) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                Carregando...
            </div>
        );
    }

    // =========================
    // RESUMO FINANCEIRO
    // =========================
    const movimentacoesFiltradas = movimentacoes.filter((mov) => {
        const [anoMov, mesMov] = mov.data.slice(0, 10).split("-").map(Number);

        return (
            mesMov === mes &&
            anoMov === ano
        );
    });
    const movimentacoesPendentes = programadas
        .filter((mov) => {
            const [anoMov, mesMov] = mov.data_programada.slice(0, 10).split("-").map(Number);
            return mesMov === mes && anoMov === ano && mov.data_programada >= hojeEmSaoPaulo();
        })
        .map<Movimentacao>((mov) => ({
            id: -mov.id,
            usuario_id: mov.usuario_id,
            tipo: mov.tipo,
            descricao: mov.descricao,
            valor: Number(mov.valor),
            categoria: mov.categoria,
            data: mov.data_programada,
            created_at: mov.created_at,
            forma_pagamento: mov.forma_pagamento,
            cartao_id: mov.cartao_id,
            cartao_nome: mov.cartao_nome,
            pendente: true,
            programada_id: mov.origem === "programacao" ? mov.id : undefined,
            recorrencia_pendente: mov.origem === "recorrencia",
            recorrencia_id: mov.recorrencia_id,
            falha_programacao: mov.status === "falha",
            erro_programacao: mov.erro,
        }));
    const hojeIso = hojeEmSaoPaulo();
    const recorrenciasPendentes = recorrencias
        .filter((recorrencia) => {
            const dataOcorrencia = `${ano}-${String(mes).padStart(2, "0")}-${String(recorrencia.dia).padStart(2, "0")}`;
            return recorrencia.ativa && dataOcorrencia >= hojeIso
                && !movimentacoes.some((mov) => mov.recorrencia_id === recorrencia.id)
                && !programadas.some((item) => item.recorrencia_id === recorrencia.id && item.status === "falha");
        })
        .map<Movimentacao>((recorrencia) => ({
            id: -1_000_000_000 - recorrencia.id,
            usuario_id: usuario.id,
            tipo: recorrencia.tipo,
            descricao: recorrencia.descricao,
            valor: Number(recorrencia.valor),
            categoria: recorrencia.categoria,
            data: `${ano}-${String(mes).padStart(2, "0")}-${String(recorrencia.dia).padStart(2, "0")}`,
            created_at: new Date().toISOString(),
            forma_pagamento: recorrencia.forma_pagamento,
            cartao_id: recorrencia.cartao_id,
            cartao_nome: recorrencia.cartao_id ? cartoes.find((cartao) => cartao.id === recorrencia.cartao_id)?.nome ?? null : null,
            pendente: true,
            recorrencia_pendente: true,
            recorrencia_id: recorrencia.id,
        }));
    const movimentacoesDaLista = [...movimentacoesFiltradas, ...movimentacoesPendentes, ...recorrenciasPendentes];

    const movimentacoesAnaliticas = movimentacoesFiltradas.filter((mov) => !mov.fatura_pagamento_id && mov.impacta_resultado !== false);
    const receitas = movimentacoesAnaliticas
        .filter((m) => m.tipo === "receita")
        .reduce((total, m) => total + Number(m.valor), 0);

    const despesas = movimentacoesAnaliticas
        .filter((m) => m.tipo === "despesa")
        .reduce((total, m) => total + Number(m.valor), 0);

    const despesasNoSaldo = movimentacoesFiltradas
        .filter((m) => m.tipo === "despesa" && (m.forma_pagamento ?? "saldo") === "saldo")
        .reduce((total, m) => total + Number(m.valor), 0);
    const entradasNoSaldo = movimentacoesFiltradas
        .filter((m) => m.tipo === "receita")
        .reduce((total, m) => total + Number(m.valor), 0);
    const inicioPeriodo = `${ano}-${String(mes).padStart(2, "0")}-01`;
    const saldoAnterior = historicoMovimentacoes
        .filter((mov) => mov.data.slice(0, 10) < inicioPeriodo)
        .reduce((total, mov) => total + (mov.tipo === "receita" ? Number(mov.valor) : (mov.forma_pagamento ?? "saldo") === "saldo" ? -Number(mov.valor) : 0), 0);
    const saldo = saldoAnterior + entradasNoSaldo - despesasNoSaldo;
    const ajusteProjetado = [...movimentacoesPendentes, ...recorrenciasPendentes]
        .filter((mov) => !mov.falha_programacao)
        .reduce((total, mov) => total + (mov.tipo === "receita" ? Number(mov.valor) : (mov.forma_pagamento ?? "saldo") === "saldo" ? -Number(mov.valor) : 0), 0);
    const saldoProjetado = saldo + ajusteProjetado;

    const dataMesAnterior = new Date(ano, mes - 2, 1);
    const mesAnterior = dataMesAnterior.getMonth() + 1;
    const anoAnterior = dataMesAnterior.getFullYear();
    const movimentacoesAnteriores = historicoMovimentacoes.filter((mov) => {
        const [anoMov, mesMov] = mov.data.slice(0, 10).split("-").map(Number);
        return mesMov === mesAnterior && anoMov === anoAnterior;
    });
    const movimentacoesAnaliticasAnteriores = movimentacoesAnteriores.filter((mov) => !mov.fatura_pagamento_id && mov.impacta_resultado !== false);
    const receitasAnteriores = movimentacoesAnaliticasAnteriores
        .filter((mov) => mov.tipo === "receita")
        .reduce((total, mov) => total + Number(mov.valor), 0);
    const despesasAnteriores = movimentacoesAnaliticasAnteriores
        .filter((mov) => mov.tipo === "despesa")
        .reduce((total, mov) => total + Number(mov.valor), 0);
    return (
        <AppLayout
            titulo="Finanças"
            subtitulo="Gerencie suas receitas e despesas."
            nome={usuario.nome}
        >
            <FinanceCards
                saldo={saldo}
                saldoProjetado={saldoProjetado}
                receitas={receitas}
                despesas={despesas}
                anterior={{
                    receitas: receitasAnteriores,
                    despesas: despesasAnteriores,
                    saldo: saldoAnterior,
                }}
            />

            <PeriodSelector
                mes={mes}
                ano={ano}
                onMesChange={setMes}
                onAnoChange={setAno}
            />

            <div className="mt-6 grid gap-6 xl:grid-cols-2">
                <FinancePieChart
                    movimentacoes={movimentacoesAnaliticas}
                    categoriaSelecionada={categoriaSelecionada}
                    onCategoriaSelect={setCategoriaSelecionada}
                />
                <FinanceLineChart
                    movimentacoes={movimentacoesAnaliticas}
                />
            </div>

            <CreditCardsPanel
                cartoes={cartoes}
                carregando={carregandoCartoes}
                movimentacoes={movimentacoesFiltradas}
                onAdicionar={adicionarCartao}
                onEditar={editarCartao}
                onRemover={removerCartao}
            />

            <AddMovimentacaoForm
                tipo={tipo}
                setTipo={setTipo}
                descricao={descricao}
                setDescricao={setDescricao}
                valor={valor}
                setValor={setValor}
                categoria={categoria}
                setCategoria={setCategoria}
                data={data}
                setData={setData}
                formaPagamento={formaPagamento}
                setFormaPagamento={setFormaPagamento}
                cartaoId={cartaoId}
                setCartaoId={setCartaoId}
                parcelas={parcelas}
                setParcelas={setParcelas}
                cartoes={cartoes}
                adicionarMovimentacao={adicionarMovimentacao}
            />

            <ScheduledMovementsPanel
                usuarioId={usuario.id}
                cartoes={cartoes}
                onProgramada={() => {
                    queryClient.invalidateQueries({ queryKey: movimentacoesKey });
                    queryClient.invalidateQueries({ queryKey: programadasKey });
                    atualizarDashboard();
                }}
            />

            <FinancialAgenda movimentacoes={movimentacoesDaLista} />

            <FinanceTable
                movimentacoes={movimentacoesDaLista}
                loading={loading}
                categoriaSelecionada={categoriaSelecionada}
                onCategoriaChange={setCategoriaSelecionada}
                onEditar={editarMovimentacao}
                onConciliar={alternarConciliacao}
                onImportada={async () => {
                    await Promise.all([
                        queryClient.invalidateQueries({ queryKey: movimentacoesKey }),
                        queryClient.invalidateQueries({ queryKey: historicoKey }),
                    ]);
                    atualizarDashboard();
                }}
                onExcluir={(id) => {
                    const movimentacao = movimentacoesDaLista.find(
                        (mov) => mov.id === id
                    );

                    if (movimentacao) {
                        abrirModalExcluir(movimentacao);
                    }
                }}
            />

            <ConfirmationDialog aberto={Boolean(movimentacaoExcluir)} titulo={movimentacaoExcluir?.pendente ? "Cancelar movimentação programada?" : "Excluir esta movimentação?"} descricao={movimentacaoExcluir?.pendente ? <>A movimentação <strong>{movimentacaoExcluir?.descricao}</strong> não será lançada.</> : <div className="space-y-3"><p>A movimentação <strong>{movimentacaoExcluir?.descricao}</strong> será removida e deixará de participar do saldo e dos relatórios.</p>{movimentacaoExcluir?.grupo_parcelamento && <div className="text-left"><label className="mb-1 block text-xs font-medium text-foreground">Excluir do parcelamento</label><AppSelect value={escopoExclusao} onValueChange={(value) => setEscopoExclusao(value as "esta" | "proximas" | "todas")} options={[{ value: "esta", label: "Somente esta parcela" }, { value: "proximas", label: "Esta e as próximas" }, { value: "todas", label: "Todas as parcelas" }]} /></div>}</div>} confirmar={movimentacaoExcluir?.pendente ? "Sim, cancelar programação" : escopoExclusao === "esta" ? "Sim, excluir movimentação" : "Sim, excluir parcelas"} processando={excluindoMovimentacao} textoProcessando="Excluindo..." onConfirmar={confirmarExclusaoMovimentacao} onAlterar={(aberto) => { if (!aberto) setMovimentacaoExcluir(null); }} />

            <EditMovimentacaoModal
                key={movimentacaoEditando?.id ?? "fechado"}
                aberto={modalAberto}
                movimentacao={movimentacaoEditando}
                cartoes={cartoes}
                onSalvar={salvarEdicao}
                onFechar={() => {
                    setModalAberto(false);
                    setMovimentacaoEditando(null);
                }}
            />
        </AppLayout>
    );
}
