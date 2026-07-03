import { HttpStatus } from '@nestjs/common';
import { BaseException } from './BaseException';
import { ErrorCode } from '../enums/error-code.enums';

export class UnauthorizedException extends BaseException {
  constructor(
    message: string = 'Unauthorized',
    code: ErrorCode = ErrorCode.UNAUTHORIZED,
    details: Record<string, any> | Record<string, any>[] = {},
  ) {
    super(message, HttpStatus.UNAUTHORIZED, code, { details });
  }
}
