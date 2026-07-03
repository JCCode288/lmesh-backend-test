import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { BaseException } from '../exceptions/BaseException';
import { ErrorResponseBody } from '../exceptions/interfaces/exception.interfaces';
import { ErrorCode } from '../enums/error-code.enums';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    const { status, body } = this.resolve(exception);

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url} -> ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    reply.status(status).send(body);
  }

  private resolve(exception: unknown): {
    status: number;
    body: ErrorResponseBody;
  } {
    const success = false;

    if (exception instanceof BaseException) {
      const statusCode = exception.getStatus();
      return {
        status: statusCode,
        body: {
          success,
          message: exception.message,
          statusCode,
          code: exception.code,
          ...(exception.errors ? { errors: exception.errors } : {}),
        },
      };
    }

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const res = exception.getResponse();

      let message = exception.message;
      let errors: Record<string, string[]> | undefined;

      if (typeof res !== 'string') {
        const obj = res as Record<string, any>;
        if (Array.isArray(obj.message)) {
          message = obj.message.join(', ');
        } else if (obj.message) {
          message = obj.message;
        }
      }

      return {
        status: statusCode,
        body: {
          success,
          statusCode,
          message,
          code: this.codeForStatus(statusCode),
          ...(errors ? { errors } : {}),
        },
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: {
        success,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal Server Error',
        code: ErrorCode.INTERNAL_ERROR,
      },
    };
  }

  private codeForStatus(status: number): ErrorCode {
    switch (status) {
      case HttpStatus.UNAUTHORIZED:
        return ErrorCode.UNAUTHORIZED;
      case HttpStatus.FORBIDDEN:
        return ErrorCode.FORBIDDEN;
      case HttpStatus.NOT_FOUND:
        return ErrorCode.NOT_FOUND;
      case HttpStatus.BAD_REQUEST:
        return ErrorCode.INVALID_PAYLOAD;
      default:
        return ErrorCode.INTERNAL_ERROR;
    }
  }
}
