import { limparSessaoLocal } from "@/lib/userSession";

const API_URL =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
let csrfEmAndamento: Promise<string> | null = null;

interface RequestOptions extends Omit<RequestInit, "body"> {
    body?: unknown;
    skipCsrf?: boolean;
}

async function obterCsrf(forcar = false) {
    if (typeof window === "undefined") return null;
    if (forcar) sessionStorage.removeItem("csrfToken");
    const existente = sessionStorage.getItem("csrfToken");
    if (existente) return existente;

    csrfEmAndamento ??= fetch(`${API_URL}/csrf`, { credentials: "include" })
        .then(async (response) => {
            if (!response.ok) throw new Error("Não foi possível preparar a sessão segura.");
            const data = await response.json();
            if (typeof data.csrfToken !== "string" || !data.csrfToken) {
                throw new Error("A API não retornou uma sessão segura válida.");
            }
            sessionStorage.setItem("csrfToken", data.csrfToken);
            return data.csrfToken as string;
        })
        .finally(() => { csrfEmAndamento = null; });
    return csrfEmAndamento;
}

async function request(endpoint: string, options: RequestOptions = {}) {
    const { body, headers, skipCsrf = false, ...rest } = options;
    const metodo = (rest.method ?? "GET").toUpperCase();
    const mutacao = !["GET", "HEAD", "OPTIONS"].includes(metodo);
    let csrfToken = mutacao && !skipCsrf ? await obterCsrf() : null;

    async function executar(token: string | null) {
        const response = await fetch(`${API_URL}${endpoint}`, {
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                ...(token ? { "X-CSRF-Token": token } : {}),
                ...headers,
            },
            body: body !== undefined ? JSON.stringify(body) : undefined,
            ...rest,
        });
        const contentType = response.headers.get("content-type") ?? "";
        const data = contentType.includes("application/json")
            ? await response.json()
            : { mensagem: (await response.text()).trim() };
        return { response, data };
    }

    let resultado = await executar(csrfToken);
    if (mutacao && !skipCsrf && resultado.response.status === 403 && resultado.data.codigo === "CSRF_INVALIDO") {
        csrfToken = await obterCsrf(true);
        resultado = await executar(csrfToken);
    }
    const { response, data } = resultado;

    if (data.csrfToken && typeof window !== "undefined") {
        sessionStorage.setItem("csrfToken", data.csrfToken);
    }

    if (response.status === 401 && data.codigo === "SESSAO_INVALIDA" && typeof window !== "undefined") {
        limparSessaoLocal();
        if (window.location.pathname !== "/") window.location.replace("/");
    }

    if (!response.ok) {
        throw new Error(data.mensagem || "Erro na requisição.");
    }

    return data;
}

export const api = {
    get: (endpoint: string) =>
        request(endpoint),

    post: (endpoint: string, body: unknown) =>
        request(endpoint, {
            method: "POST",
            body,
        }),

    authPost: (endpoint: string, body: unknown) =>
        request(endpoint, {
            method: "POST",
            body,
            skipCsrf: true,
        }),

    put: (endpoint: string, body: unknown) =>
        request(endpoint, {
            method: "PUT",
            body,
        }),

    delete: (endpoint: string, body?: unknown) =>
        request(endpoint, {
            method: "DELETE",
            body,
        }),
};
