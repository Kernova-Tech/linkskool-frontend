import { ApiError, apiRequest } from "../client";
import type { FormAnswers, PublicForm, FormNextAction, FormSession, MyTask } from "../models";

/** Upload id per file already sent, so a retried response does not send it again. */
const staged = new WeakMap<File, string>();

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** No answer at all, or one that says try again: a piece can be sent again safely. */
const retryable = (e: unknown) =>
    !(e instanceof ApiError) || e.status === 408 || e.status === 429 || e.status >= 500;

async function withRetry<T>(send: () => Promise<T>, attempts = 6): Promise<T> {
    for (let attempt = 1; ; attempt++) {
        try {
            return await send();
        } catch (e) {
            if (!retryable(e) || attempt >= attempts) throw e;
            await sleep(Math.min(15000, 1000 * 2 ** (attempt - 1)));
        }
    }
}

/** Sends one file for a question, a piece at a time; answers with its upload id. */
async function stageFile(
    token: string,
    fieldId: string,
    file: File,
    headers: Record<string, string>,
    onBytes: (sent: number) => void,
): Promise<string> {
    const known = staged.get(file);
    if (known) {
        onBytes(file.size);
        return known;
    }
    const base = `forms/${encodeURIComponent(token)}/uploads`;
    const { upload, chunkBytes } = (await withRetry(() =>
        apiRequest<{ upload: string; chunkBytes: number }>(base, {
            method: "POST",
            body: { fieldId, name: file.name, size: file.size },
            headers,
        }),
    )).data;

    let received = 0;
    while (received < file.size) {
        const offset = received;
        const body = new FormData();
        body.append("chunk", file.slice(offset, offset + chunkBytes), "chunk");
        received = (await withRetry(() =>
            apiRequest<{ received: number }>(`${base}/${upload}?offset=${offset}`, { method: "POST", body, headers }),
        )).data.received;
        onBytes(received);
    }

    staged.set(file, upload);
    return upload;
}

/** The thank-you message, and the next step if the form has one. */
type FormSent = { message: string; nextAction: FormNextAction | null };

export const formService = {
    /** With the session, a task says where this person stands. */
    async get(token: string, accessToken?: string) {
        const headers: Record<string, string> = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
        return (await apiRequest<PublicForm>(`forms/${encodeURIComponent(token)}`, { headers })).data;
    },

    /** Signs in with a Google ID token; the API checks it and returns the account and its session. */
    async signIn(idToken: string): Promise<FormSession> {
        const result = (await apiRequest<{
            user: { email: string; name?: string; firstName?: string };
            session: { accessToken: string };
        }>("cbt/users", { method: "POST", body: { idToken }, headers: { "X-Client-Auth": "2" } })).data;
        return {
            accessToken: result.session.accessToken,
            name: result.user.firstName || result.user.name || result.user.email,
            email: result.user.email,
        };
    },

    /**
     * `website` is a field people never see; it stays empty for them and only
     * bots fill it.
     *
     * Files go first, each in 1 MB pieces retried on their own (a whole file
     * in one request fails on a slow connection, and has to start again from
     * the first byte). The response then names them in `_staged_files`, with
     * the answers as JSON. A file already sent is not sent again if the
     * response itself has to be retried.
     */
    async submit(
        token: string,
        answers: FormAnswers,
        email: string,
        website: string,
        files: Record<string, File[]> = {},
        accessToken?: string,
        onProgress?: (percent: number) => void,
    ) {
        const path = `forms/${encodeURIComponent(token)}/responses`;
        const headers: Record<string, string> = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
        const all = Object.values(files).flat();
        if (all.length === 0) {
            return (await apiRequest<FormSent>(path, { method: "POST", body: { answers, email, website }, headers })).data;
        }

        const send = async () => {
            const total = all.reduce((sum, f) => sum + f.size, 0) || 1;
            let done = 0;
            const list: { key: string; upload: string }[] = [];
            for (const [fieldId, chosen] of Object.entries(files)) {
                for (const file of chosen) {
                    const upload = await stageFile(token, fieldId, file, headers, (sent) =>
                        onProgress?.(Math.min(100, Math.round(((done + sent) / total) * 100))),
                    );
                    done += file.size;
                    list.push({ key: `file_${fieldId}[]`, upload });
                }
            }

            const body = new FormData();
            body.append("answers", JSON.stringify(answers));
            body.append("email", email);
            body.append("website", website);
            body.append("_staged_files", JSON.stringify(list));
            return (await apiRequest<FormSent>(path, { method: "POST", body, headers })).data;
        };

        try {
            return await send();
        } catch (e) {
            // The server let go of a file sent earlier (a day passed): send them again, once.
            if (!(e instanceof ApiError) || (e.payload as { code?: string } | undefined)?.code !== "upload_expired") throw e;
            all.forEach((f) => staged.delete(f));
            return await send();
        }
    },

    /** Every task the signed-in person is on: what to do first, then what is waiting, then what is done. */
    async mine(accessToken: string) {
        return (await apiRequest<MyTask[]>("forms/mine", { headers: { Authorization: `Bearer ${accessToken}` } })).data;
    },
};
