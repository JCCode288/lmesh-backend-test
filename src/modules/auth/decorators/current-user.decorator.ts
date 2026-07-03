import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { AuthUser } from '../interfaces/jwt-payload.interface';

export const CurrentUser = createParamDecorator(
    (_data: unknown, ctx: ExecutionContext): AuthUser => {
        const request = ctx.switchToHttp().getRequest<FastifyRequest & { user: AuthUser }>();
        return request.user;
    },
);
