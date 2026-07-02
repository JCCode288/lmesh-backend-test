export interface ErrorResponseBody {
    success: false;
    statusCode: number;
    message: string;
    details: Record<string, any> | Record<string, any>[];
    path: string;
    timestamp: string;
}
