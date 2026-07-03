import { ErrorCode } from "../enums/error-code.enums";

export interface ErrorResponseBody {
    message: string;
    code: ErrorCode;
    errors?: Record<string, string[]>;
}

export interface SuccessResponseBody<T = unknown> {
    data: T;
    message?: string;
    code?: string;
}
