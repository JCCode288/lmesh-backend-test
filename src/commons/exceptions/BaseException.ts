import { HttpException, HttpStatus } from "@nestjs/common";

export class BaseException extends HttpException {
    public success: boolean;
    public details: Record<string, any> | Record<string, any>[];

    constructor(message: string = "Internal Server Error", status = HttpStatus.INTERNAL_SERVER_ERROR, details = {}) {
        super(message, status);
        this.message = message;
        this.success = false;
        this.details = details;
    }
}