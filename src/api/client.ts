import { apiConfig } from "./config";
import type { ServerResponse } from "./models/serverResponse";
import { toCamel, toSnake } from "./util/transform";

export class ApiError extends Error {
    public readonly status: number;
    public readonly payload?: unknown;

    constructor(message: string, status: number, payload?: unknown) {
        super(message);
        this.status = status;
        this.payload = payload;
    }
}

const buildUrl = (path: string) => {
    const trimmedPath = path.replace(/^\/+/, "");
    return `${apiConfig.baseUrl}/${trimmedPath}`;
};

type ApiResponseType = 'json' | 'text' | 'blob' | 'arrayBuffer' | 'formData';

type ApiRequestInit = Omit<RequestInit, "body"> &
{
    body?: unknown;
    responseType?: ApiResponseType;
};

export async function apiRequest<T = unknown>(
    path: string,
    init: ApiRequestInit = {}
): Promise<ServerResponse<T>> {
    const url = buildUrl(path);
    const headers = new Headers(init.headers ?? {});
    const { body, responseType = 'json', ...rest } = init;

    if (apiConfig.apiKey) {
        headers.set('x-api-key', apiConfig.apiKey);
    }

    const requestInit: RequestInit = {
        ...rest,
        headers,
    };

    if (body !== undefined) {
        if (body instanceof FormData) {
            // Sent as is: renaming keys would turn it into a plain object, and
            // the browser must set the multipart boundary in Content-Type itself.
            requestInit.body = body;
        } else if (typeof body === 'object') {
            if (!headers.has('Content-Type')) {
                headers.set('Content-Type', 'application/json');
            }
            requestInit.body = JSON.stringify(toSnake(body));
        } else {
            requestInit.body = String(body);
        }
    }

    const response = await fetch(url, requestInit);

    if (responseType === 'blob') {
        if (!response.ok) {
            throw new ApiError(response.statusText, response.status);
        }

        return {
            statusCode: response.status,
            success: true,
            message: undefined,
            data: (await response.blob()) as T,
        };
    }

    if (responseType === 'arrayBuffer') {
        if (!response.ok) {
            throw new ApiError(response.statusText, response.status);
        }

        return {
            statusCode: response.status,
            success: true,
            message: undefined,
            data: (await response.arrayBuffer()) as T,
        };
    }

    const text = await response.text();

    let parsed: unknown = null;
    if (text) {
        try {
            parsed = JSON.parse(text);
        } catch {
            parsed = text;
        }
    }

    const payload =
        typeof parsed === 'object' && parsed !== null
            ? (parsed as Record<string, unknown>)
            : null;

    const serverResponse: ServerResponse<T> = {
        statusCode: response.status,
        success: (payload?.['success'] as boolean) ?? response.ok,
        message:
            (payload?.['message'] as string | undefined) ??
            (response.ok ? undefined : response.statusText),
        data: toCamel(payload?.['data'] ?? parsed ?? null) as T,
    };

    if (!response.ok) {
        throw new ApiError(
            serverResponse.message ?? response.statusText,
            response.status,
            serverResponse
        );
    }

    return serverResponse;
}

