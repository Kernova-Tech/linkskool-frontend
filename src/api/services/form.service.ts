import { apiRequest } from "../client";
import type { FormAnswers, PublicForm, FormNextAction } from "../models";

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
    async submit(token: string, answers: FormAnswers, email: string, website: string, files: Record<string, File> = {}) {
        const path = `forms/${encodeURIComponent(token)}/responses`;
        if (Object.keys(files).length === 0) {
            return (await apiRequest<FormSent>(path, { method: "POST", body: { answers, email, website } })).data;
        }

        const body = new FormData();
        body.append("answers", JSON.stringify(answers));
        body.append("email", email);
        body.append("website", website);
        for (const [fieldId, file] of Object.entries(files)) {
            body.append(`file_${fieldId}`, file, file.name);
        }
        return (await apiRequest<FormSent>(path, { method: "POST", body })).data;
    },
};
