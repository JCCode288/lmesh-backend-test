import { HttpException, HttpStatus } from "@nestjs/common";
import { ErrorCode } from "../enums/error-code.enums";

export interface BaseExceptionOptions {
    details?: Record<string, any> | Record<string, any>[];
    errors?: Record<string, string[]>;
}

export class BaseException extends HttpException {
    public readonly code: ErrorCode;
    public details: Record<string, any> | Record<string, any>[];
    public errors?: Record<string, string[]>;

    constructor(
        message: string = "Internal Server Error",
        status: number = HttpStatus.INTERNAL_SERVER_ERROR,
        code: ErrorCode = ErrorCode.INTERNAL_ERROR,
        options: BaseExceptionOptions = {},
    ) {
        super(message, status);
        this.message = message;
        this.code = code;
        this.details = options.details ?? {};
        this.errors = options.errors;
    }
}
