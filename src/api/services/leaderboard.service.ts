import { apiRequest } from "../client";

/** A named period, or a closed one by its key: "2026-10" for a month, "2026" for a year. */
export type BoardPeriod = "month" | "last_month" | "year" | "last_year" | "all" | (string & {});

/**
 * Staff and branches rank alike: rate (approved of assigned), then approved,
 * then the quicker average turnaround. Over a period, staff given under half
 * as many tasks as the most anyone was given are listed but not ranked.
 */
export interface BoardRow {
    name: string;
    assigned: number;
    approved: number;
    rate: number;
    /** Average hours from a task going out to its approved answer. */
    avgHours: number | null;
    eligible: boolean;
    /** Null when not ranked. */
    rank: number | null;
    /** Rewarded from this period. */
    rewarded?: boolean;
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
    periodKey: string | null;
    periodLabel: string;
    ended: boolean;
    /** Set once the period is closed: these are then its final results. */
    closed: { at: string } | null;
    /** Closed periods, newest first. */
    results: { key: string; label: string }[];
    minAssigned: number;
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
