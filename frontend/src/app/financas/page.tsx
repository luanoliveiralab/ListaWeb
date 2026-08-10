"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import AppLayout from "@/components/layout/AppLayout";
import FinanceCards from "@/components/financas/FinanceCards";
import AddMovimentacaoForm from "@/components/financas/AddMovimentacaoForm";
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

    const [modalExcluir, setModalExcluir] = useState(false);

    const [tipo, setTipo] = useState<"receita" | "despesa">("receita");
    const [descricao, setDescricao] = useState("");
    const [valor, setValor] = useState("");
    const [categoria, setCategoria] = useState("");
    const [formaPagamento, setFormaPagamento] = useState<"saldo" | "credito">("saldo");
    const [cartaoId, setCartaoId] = useState("");
    const [data, setData] = useState(
        new Date().toISOString().split("T")[0]
    );

    const {
        mes,
        ano,
        setMes,
        setAno,
    } = usePeriod();

    const movimentacoesKey = ["financas", usuario?.id, ano, mes] as const;
    const cartoesKey = ["cartoes", usuario?.id] as const;
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
    const movimentacoes = movimentacoesQuery.data ?? [];
    const cartoes = cartoesQuery.data ?? [];
    const loading = movimentacoesQuery.isPending;
    const carregandoCartoes = cartoesQuery.isPending;

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
        setData(new Date().toISOString().split("T")[0]);

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
            });

            atualizarMovimentacoes((prev) => prev.map((mov) => mov.id === temporaria.id ? nova : mov));
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
        setMovimentacaoExcluir(movimentacao);
        setModalExcluir(true);
    }

    async function excluirMovimentacao(id: number) {
        const removida = movimentacoes.find((mov) => mov.id === id);
        atualizarMovimentacoes((prev) => prev.filter((mov) => mov.id !== id));
        try {
            await financasService.remover(id);
            atualizarDashboard();
            mostrarAviso("Movimentação excluída com sucesso!");
        } catch (err) {
            if (removida) atualizarMovimentacoes((prev) => [removida, ...prev]);
            console.error(err);
            mostrarAviso("Erro ao excluir movimentação.", "erro");
        }
    }

    // =========================
    // EDITAR
    // =========================
    async function salvarEdicao(mov: Movimentacao) {
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
            });

            atualizarMovimentacoes((prev) =>
                prev.map((m) =>
                    m.id === atualizada.id ? atualizada : m
                )
            );
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

    const receitas = movimentacoesFiltradas
        .filter((m) => m.tipo === "receita")
        .reduce((total, m) => total + Number(m.valor), 0);

    const despesas = movimentacoesFiltradas
        .filter((m) => m.tipo === "despesa")
        .reduce((total, m) => total + Number(m.valor), 0);

    const despesasNoSaldo = movimentacoesFiltradas
        .filter((m) => m.tipo === "despesa" && (m.forma_pagamento ?? "saldo") === "saldo")
        .reduce((total, m) => total + Number(m.valor), 0);
    const saldo = receitas - despesasNoSaldo;

    const dataMesAnterior = new Date(ano, mes - 2, 1);
    const mesAnterior = dataMesAnterior.getMonth() + 1;
    const anoAnterior = dataMesAnterior.getFullYear();
    const movimentacoesAnteriores = movimentacoes.filter((mov) => {
        const [anoMov, mesMov] = mov.data.slice(0, 10).split("-").map(Number);
        return mesMov === mesAnterior && anoMov === anoAnterior;
    });
    const receitasAnteriores = movimentacoesAnteriores
        .filter((mov) => mov.tipo === "receita")
        .reduce((total, mov) => total + Number(mov.valor), 0);
    const despesasAnteriores = movimentacoesAnteriores
        .filter((mov) => mov.tipo === "despesa")
        .reduce((total, mov) => total + Number(mov.valor), 0);
    const despesasSaldoAnteriores = movimentacoesAnteriores
        .filter((mov) => mov.tipo === "despesa" && (mov.forma_pagamento ?? "saldo") === "saldo")
        .reduce((total, mov) => total + Number(mov.valor), 0);

    return (
        <AppLayout
            titulo="Finanças"
            subtitulo="Gerencie suas receitas e despesas."
            nome={usuario.nome}
        >
            <FinanceCards
                saldo={saldo}
                receitas={receitas}
                despesas={despesas}
                anterior={{
                    receitas: receitasAnteriores,
                    despesas: despesasAnteriores,
                    saldo: receitasAnteriores - despesasSaldoAnteriores,
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
                    movimentacoes={movimentacoesFiltradas}
                    categoriaSelecionada={categoriaSelecionada}
                    onCategoriaSelect={setCategoriaSelecionada}
                />
                <FinanceLineChart
                    movimentacoes={movimentacoes}
                />
            </div>

            <CreditCardsPanel
                cartoes={cartoes}
                carregando={carregandoCartoes}
                movimentacoes={movimentacoesFiltradas}
                onAdicionar={adicionarCartao}
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
                cartoes={cartoes}
                adicionarMovimentacao={adicionarMovimentacao}
            />

            <FinanceTable
                movimentacoes={movimentacoesFiltradas}
                loading={loading}
                categoriaSelecionada={categoriaSelecionada}
                onCategoriaChange={setCategoriaSelecionada}
                onEditar={editarMovimentacao}
                onExcluir={(id) => {
                    const movimentacao = movimentacoes.find(
                        (mov) => mov.id === id
                    );

                    if (movimentacao) {
                        abrirModalExcluir(movimentacao);
                    }
                }}
            />

            {modalExcluir && movimentacaoExcluir && (
                <div className="modal-backdrop">
                    <div className="modal-panel max-w-md">

                        <h2 className="text-xl font-bold">
                            Excluir movimentação?
                        </h2>

                        <p className="mt-2 text-muted-foreground">
                            Tem certeza que deseja excluir “{movimentacaoExcluir.descricao}”?
                        </p>

                        <div className="modal-actions">

                            <button
                                onClick={() => {
                                    setModalExcluir(false);
                                    setMovimentacaoExcluir(null);
                                }}
                                className="button-secondary"
                            >
                                Cancelar
                            </button>

                            <button
                                onClick={async () => {
                                    await excluirMovimentacao(movimentacaoExcluir.id);
                                    setModalExcluir(false);
                                    setMovimentacaoExcluir(null);
                                }}
                                className="button-danger"
                            >
                                Excluir
                            </button>

                        </div>
                    </div>
                </div>
            )}

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
