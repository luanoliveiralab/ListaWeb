const MODOS_SUPORTADOS = ["manual"];

function obterStatusIntegracaoBancaria() {
    const provedor = String(process.env.BANKING_PROVIDER || "manual").toLowerCase();
    return {
        modo: MODOS_SUPORTADOS.includes(provedor) ? provedor : "manual",
        conexao_automatica_disponivel: false,
        importacoes_disponiveis: ["ofx", "csv"],
        mensagem: "A conexão bancária automática ainda não está habilitada. A importação manual mantém o usuário no controle dos dados.",
    };
}

module.exports = { obterStatusIntegracaoBancaria };
