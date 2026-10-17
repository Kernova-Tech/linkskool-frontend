import { apiRequest } from "../client";

export type BoardPeriod = "month" | "last_month" | "all";

/** Staff and branches rank alike: rate (approved of assigned), then on time, then approved. */
export interface BoardRow {
    name: string;
    assigned: number;
    approved: number;
    onTime: number;
    rate: number;
    rank: number;
    /** Staff: their branch. */
    branch?: string | null;
    /** A branch: how many people. */
    staff?: number;
}

export interface PublicBoard {
    organization: string;
    logoUrl: string | null;
    /** "task" when it ranks one task alone. */
    period: BoardPeriod | "task";
    periodLabel: string;
    tasks: { token: string; title: string; deadline: string | null; assigned: number; done: number }[];
    branches: BoardRow[];
    staff: BoardRow[];
}

/** An approved task's card: who did what, for whom. */
export interface CompletionCard {
    name: string;
    branch: string | null;
    task: string;
    organization: string;
    logoUrl: string | null;
    approvedAt: string | null;
    leaderboardUrl: string | null;
}

export interface Badge {
    kind: "staff" | "branch";
    recipient: string;
    branch: string | null;
    title: string;
    message: string | null;
    periodLabel: string | null;
    organization: string;
    logoUrl: string | null;
    awardedAt: string;
}

/** An organization's public leaderboard, and the badges its rewards come with. */
export const leaderboardService = {
    /** A period, or one of its tasks by the token in the task's link. */
    async board(token: string, period: BoardPeriod, task?: string) {
        const query = new URLSearchParams({ period, ...(task ? { task } : {}) });
        return (await apiRequest<PublicBoard>(`leaderboards/${encodeURIComponent(token)}?${query}`)).data;
    },
    async done(code: string) {
        return (await apiRequest<CompletionCard>(`leaderboards/done/${encodeURIComponent(code)}`)).data;
    },
    async badge(code: string) {
        return (await apiRequest<Badge>(`leaderboards/badge/${encodeURIComponent(code)}`)).data;
    },
};
