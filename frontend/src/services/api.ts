const API_URL =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
let csrfEmAndamento: Promise<string> | null = null;

interface RequestOptions extends Omit<RequestInit, "body"> {
    body?: unknown;
    skipCsrf?: boolean;
}

async function request(endpoint: string, options: RequestOptions = {}) {
    const { body, headers, skipCsrf = false, ...rest } = options;
    const metodo = (rest.method ?? "GET").toUpperCase();
    let csrfToken = typeof window !== "undefined" ? sessionStorage.getItem("csrfToken") : null;

    if (!["GET", "HEAD", "OPTIONS"].includes(metodo) && !skipCsrf && !csrfToken) {
        csrfEmAndamento ??= fetch(`${API_URL}/csrf`, { credentials: "include" })
            .then(async (csrfResponse) => {
                if (!csrfResponse.ok) throw new Error("Não foi possível preparar a sessão segura.");
                const csrfData = await csrfResponse.json();
                sessionStorage.setItem("csrfToken", csrfData.csrfToken);
                return csrfData.csrfToken as string;
            })
            .finally(() => { csrfEmAndamento = null; });
        csrfToken = await csrfEmAndamento;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...(csrfToken && !["GET", "HEAD", "OPTIONS"].includes(metodo) ? { "X-CSRF-Token": csrfToken } : {}),
            ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        ...rest,
    });

    const data = await response.json();

    if (data.csrfToken && typeof window !== "undefined") {
        sessionStorage.setItem("csrfToken", data.csrfToken);
    }

    if (response.status === 401 && typeof window !== "undefined") {
        localStorage.removeItem("usuario");
        sessionStorage.removeItem("csrfToken");
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

    delete: (endpoint: string) =>
        request(endpoint, {
            method: "DELETE",
        }),
};
