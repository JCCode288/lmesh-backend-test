import { HttpStatus } from '@nestjs/common';
import { BaseException } from './BaseException';
import { ErrorCode } from '../enums/error-code.enums';

export class FileNotFoundException extends BaseException {
  constructor(
    message: string = 'File not found',
    details: Record<string, any> | Record<string, any>[] = {},
  ) {
    super(message, HttpStatus.NOT_FOUND, ErrorCode.NOT_FOUND, { details });
  }
}
