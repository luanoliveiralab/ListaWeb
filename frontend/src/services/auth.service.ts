import { api } from "./api";

interface LoginDTO {
    email: string;
    senha: string;
}

interface CadastroDTO {
    nome: string;
    email: string;
    senha: string;
}

export const authService = {
    login(dados: LoginDTO) {
        return api.post("/login", dados);
    },

    cadastro(dados: CadastroDTO) {
        return api.post("/cadastro", dados);
    },

    logout() {
        return api.post("/logout", {});
    },

    me() {
        return api.get("/me");
    },

    solicitarRecuperacao(email: string) {
        return api.post("/esqueci-senha", { email });
    },

    redefinirSenha(token: string, novaSenha: string) {
        return api.post("/redefinir-senha", { token, novaSenha });
    },
};
