import { api } from "./api";
import type { Usuario } from "@/types/Usuario";

export const usuarioService = {
    atualizar(id: number, dados: Partial<Usuario> & { senhaAtual?: string }) {
        return api.put(`/usuarios/${id}`, dados);
    },

    alterarSenha(senhaAtual: string, novaSenha: string) {
        return api.put("/alterar-senha", {
            senhaAtual,
            novaSenha,
        });
    },
};
