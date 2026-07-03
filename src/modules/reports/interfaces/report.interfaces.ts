import { ALLOWED_TYPES } from "src/utils/constants/report.constants";

export type AllowedTypes = typeof ALLOWED_TYPES;
export type AllowedTypeValues = AllowedTypes[keyof AllowedTypes];


export interface SubmitReportInput {
    userId: number;
    filename: string;
    contentType: 'csv' | 'json';
    data: Buffer;
    partNumber: string;
    plantCode: string;
}