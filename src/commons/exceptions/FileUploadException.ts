import { HttpStatus } from "@nestjs/common";
import { BaseException } from "./BaseException";
import { ErrorCode } from "../enums/error-code.enums";

export class FileUploadException extends BaseException {
    constructor(message: string = "File not found", details: Record<string, any> | Record<string, any>[] = {}) {
        super(message, HttpStatus.BAD_REQUEST, ErrorCode.FILE_UPLOAD_ERROR, { details });
    }
}
