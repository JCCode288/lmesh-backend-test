export interface SuccessResponseBody<T = unknown> {
    data: T;
    success: boolean;
    statusCode: number;
    message?: string;
    code?: string;
}
