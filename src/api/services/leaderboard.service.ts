import { apiRequest } from "../client";

export type BoardPeriod = "month" | "last_month" | "all";

export interface PublicBoard {
    organization: string;
    period: BoardPeriod;
    periodLabel: string;
    tasks: number;
    branches: { id: number | null; name: string; approved: number; assigned: number; rate: number; rank: number }[];
    staff: { name: string; branch: string | null; approved: number; onTime: number; rank: number }[];
}

export interface Badge {
    kind: "staff" | "branch";
    recipient: string;
    branch: string | null;
    title: string;
    message: string | null;
    periodLabel: string | null;
    organization: string;
    awardedAt: string;
}

/** An organization's public leaderboard, and the badges its rewards come with. */
export const leaderboardService = {
    async board(token: string, period: BoardPeriod) {
        return (await apiRequest<PublicBoard>(`leaderboards/${encodeURIComponent(token)}?period=${period}`)).data;
    },
    async badge(code: string) {
        return (await apiRequest<Badge>(`leaderboards/badge/${encodeURIComponent(code)}`)).data;
    },
};
