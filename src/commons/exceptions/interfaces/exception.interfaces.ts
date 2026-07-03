import { ErrorCode } from 'src/commons/enums/error-code.enums';

export interface ErrorResponseBody {
  success: boolean;
  statusCode: number;
  message: string;
  code: ErrorCode;
  errors?: Record<string, string[]>;
}

export interface BaseExceptionOptions {
  details?: Record<string, any> | Record<string, any>[];
  errors?: Record<string, string[]>;
}
