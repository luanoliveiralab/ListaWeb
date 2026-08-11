import { api } from "./api";
import type { Usuario } from "@/types/Usuario";

export const usuarioService = {
    atualizar(id: number, dados: Partial<Usuario> & { senhaAtual?: string }) {
        return api.put(`/usuarios/${id}`, dados);
    },

    buscarPorId(id: number) {
        return api.get(`/usuarios/${id}`);
    },

    alterarSenha(senhaAtual: string, novaSenha: string) {
        return api.put("/alterar-senha", {
            senhaAtual,
            novaSenha,
        });
    },

    excluir(id: number) {
        return api.delete(`/usuarios/${id}`);
    },
};
