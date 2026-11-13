export type ServerResponse<T = unknown> = {
    statusCode: number;
    success: boolean;
    message?: string;
    /** A machine-readable reason for a failure, when the API gives one (e.g. upload_expired). */
    code?: string;
    data: T;
};
