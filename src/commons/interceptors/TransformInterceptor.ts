import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { RESPONSE_MESSAGE_KEY } from "../decorators/ResponseMessage.decorator";
import { FastifyReply } from "fastify";
import { SuccessResponseBody } from "./interfaces/interceptor.interfaces";

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, SuccessResponseBody<T>> {
    constructor(private readonly reflector: Reflector) { }

    intercept(context: ExecutionContext, next: CallHandler<T>): Observable<SuccessResponseBody<T>> {
        const message = this.reflector.getAllAndOverride<string | undefined>(RESPONSE_MESSAGE_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        const statusCode = context.switchToHttp().getResponse<FastifyReply>().statusCode;

        return next.handle().pipe(
            map((payload): SuccessResponseBody<T> => {
                const success = true;

                if (this.isEnvelope(payload)) {
                    payload.statusCode = payload.statusCode || statusCode;
                    payload.success = success;

                    return message ? { message, ...payload } : payload;
                }

                return {
                    success,
                    statusCode,
                    data: payload,
                    ...(message ? { message } : {}),
                };
            }),
        );
    }

    private isEnvelope(payload: unknown): payload is SuccessResponseBody<T> {
        return typeof payload === "object" && payload !== null && "data" in payload;
    }
}
