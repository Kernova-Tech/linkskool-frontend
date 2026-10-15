import { apiRequest } from "../client";
import type { FormAnswers, PublicForm } from "../models";

export const formService = {
    async get(token: string, signal?: AbortSignal) {
        return (await apiRequest<PublicForm>(`forms/${encodeURIComponent(token)}`, { signal })).data;
    },

    /** `website` is a field people never see; it stays empty for them and only bots fill it. */
    async submit(token: string, answers: FormAnswers, email: string, website: string) {
        return (
            await apiRequest<{ message: string }>(`forms/${encodeURIComponent(token)}/responses`, {
                method: "POST",
                body: { answers, email, website },
            })
        ).data;
    },
};
