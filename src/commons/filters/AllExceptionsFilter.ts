import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
    Logger,
} from "@nestjs/common";
import { FastifyReply, FastifyRequest } from "fastify";
import { BaseException } from "../exceptions/BaseException";
import { ErrorResponseBody } from "../interfaces/exception.interfaces";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);

    catch(exception: unknown, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const reply = ctx.getResponse<FastifyReply>();
        const request = ctx.getRequest<FastifyRequest>();

        const { status, message, details } = this.resolve(exception);

        if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
            this.logger.error(
                `${request.method} ${request.url} -> ${status}`,
                exception instanceof Error ? exception.stack : String(exception),
            );
        }

        const body: ErrorResponseBody = {
            success: false,
            statusCode: status,
            message,
            details,
            path: request.url,
            timestamp: new Date().toISOString(),
        };

        reply.status(status).send(body);
    }

    private resolve(exception: unknown): {
        status: number;
        message: string;
        details: Record<string, any> | Record<string, any>[];
    } {
        if (exception instanceof BaseException) {
            return {
                status: exception.getStatus(),
                message: exception.message,
                details: exception.details,
            };
        }

        if (exception instanceof HttpException) {
            const status = exception.getStatus();
            const res = exception.getResponse();

            if (typeof res === "string") {
                return { status, message: res, details: {} };
            }

            const obj = res as Record<string, any>;
            let message = obj.message ?? exception.message;
            if (Array.isArray(obj.message)) {
                message = obj.message.join(", ");
            }

            return {
                status,
                message,
                details: obj,
            };
        }

        return {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            message: "Internal Server Error",
            details: {},
        };
    }
}
