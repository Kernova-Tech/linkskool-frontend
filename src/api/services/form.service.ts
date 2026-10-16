import { apiRequest } from "../client";
import type { FormAnswers, PublicForm, FormNextAction, FormSession } from "../models";

/** The thank-you message, and the next step if the form has one. */
type FormSent = { message: string; nextAction: FormNextAction | null };

export const formService = {
    async get(token: string, signal?: AbortSignal) {
        return (await apiRequest<PublicForm>(`forms/${encodeURIComponent(token)}`, { signal })).data;
    },

    /**
     * `website` is a field people never see; it stays empty for them and only
     * bots fill it. With files, the response goes as multipart: the answers as
     * JSON, each file as file_{question id}.
     */
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

    async submit(
        token: string,
        answers: FormAnswers,
        email: string,
        website: string,
        files: Record<string, File> = {},
        accessToken?: string,
    ) {
        const path = `forms/${encodeURIComponent(token)}/responses`;
        const headers: Record<string, string> = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
        if (Object.keys(files).length === 0) {
            return (await apiRequest<FormSent>(path, { method: "POST", body: { answers, email, website }, headers })).data;
        }

        const body = new FormData();
        body.append("answers", JSON.stringify(answers));
        body.append("email", email);
        body.append("website", website);
        for (const [fieldId, file] of Object.entries(files)) {
            body.append(`file_${fieldId}`, file, file.name);
        }
        return (await apiRequest<FormSent>(path, { method: "POST", body, headers })).data;
    },
};
