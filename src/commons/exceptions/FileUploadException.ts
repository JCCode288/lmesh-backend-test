import { HttpStatus } from "@nestjs/common";
import { BaseException } from "./BaseException";

export class FileUploadException extends BaseException {
    constructor(message: string = "File not found", details: Record<string, any> | Record<string, any>[] = {}) {
        super(message, HttpStatus.BAD_REQUEST, details);
    }
}