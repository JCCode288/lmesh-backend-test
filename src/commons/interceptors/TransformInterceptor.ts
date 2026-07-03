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
import { SuccessResponseBody } from "../interfaces/exception.interfaces";

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, SuccessResponseBody<T>> {
    constructor(private readonly reflector: Reflector) { }

    intercept(context: ExecutionContext, next: CallHandler<T>): Observable<SuccessResponseBody<T>> {
        const message = this.reflector.getAllAndOverride<string | undefined>(RESPONSE_MESSAGE_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        return next.handle().pipe(
            map((payload): SuccessResponseBody<T> => {
                if (this.isEnvelope(payload)) {
                    return message ? { message, ...payload } : payload;
                }

                return {
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
