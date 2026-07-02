import { HttpStatus } from "@nestjs/common";
import { BaseException } from "./BaseException";

export class InvalidPayload extends BaseException {
    constructor(message: string = "Invalid Body Payload", details: Record<string, any> | Record<string, any>[] = {}) {
        super(message, HttpStatus.BAD_REQUEST, details);
    }
}