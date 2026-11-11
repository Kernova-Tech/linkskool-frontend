import { apiRequest } from "../client";

/** A certificate found by its code, as anyone checking it may see it. */
export interface CertificateCheck {
    code: string;
    recipient: string;
    title: string;
    issuedAt: string;
    imageUrl: string | null;
}

export const certificateService = {
    /** Throws when no certificate has the code. */
    async verify(code: string): Promise<CertificateCheck> {
        return (await apiRequest<CertificateCheck>(`certificates/${encodeURIComponent(code)}`)).data;
    },
};
