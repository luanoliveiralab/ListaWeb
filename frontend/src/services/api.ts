const API_URL =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

interface RequestOptions extends Omit<RequestInit, "body"> {
    body?: unknown;
}

async function request(endpoint: string, options: RequestOptions = {}) {
    const { body, headers, ...rest } = options;
    const metodo = (rest.method ?? "GET").toUpperCase();
    let csrfToken = typeof window !== "undefined" ? sessionStorage.getItem("csrfToken") : null;

    if (!["GET", "HEAD", "OPTIONS"].includes(metodo) && !csrfToken) {
        const csrfResponse = await fetch(`${API_URL}/csrf`, { credentials: "include" });
        if (!csrfResponse.ok) throw new Error("Não foi possível preparar a sessão segura.");
        const csrfData = await csrfResponse.json();
        csrfToken = csrfData.csrfToken;
        sessionStorage.setItem("csrfToken", csrfToken ?? "");
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
