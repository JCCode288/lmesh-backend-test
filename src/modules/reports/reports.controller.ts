import { Controller, Get, HttpCode, HttpStatus, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { ReportsService } from './reports.service';
import { FileUploadException } from 'src/commons/exceptions/FileUploadException';
import { InvalidPayload } from 'src/commons/exceptions/InvalidPayload';
import { ResponseMessage } from 'src/commons/decorators/ResponseMessage.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/jwt-payload.interface';
import { ReportStatus } from 'generated/prisma/enums';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiQuery } from '@nestjs/swagger';
import { ANALYSIS_JOB_NAME } from 'src/utils/constants/queue.constant';
import { ALLOWED_TYPES } from 'src/utils/constants/report.constants';
import { AllowedTypes, AllowedTypeValues } from './interfaces/report.interfaces';
import { ReportDto } from './dto/reports.dto';

@ApiBearerAuth("jwt")
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
    private ALLOWED_TYPES: AllowedTypes = ALLOWED_TYPES;

    constructor(private readonly reportSvc: ReportsService) { }

    @Get('')
    @ApiQuery({ name: 'status', required: false, enum: ReportStatus })
    async getAllReports(@CurrentUser() user: AuthUser, @Query('status') status?: string) {
        const resolvedStatus = this.resolveStatus(status);
        return await this.reportSvc.getAllReports(user.userId, resolvedStatus);
    }

    @Post('analyze')
    @ApiConsumes('multipart/form-data')
    @ApiBody({ type: ReportDto })
    @ResponseMessage('Analysis queued')
    async analyzeReport(@Req() req: FastifyRequest, @CurrentUser() user: AuthUser) {
        const file = await req.file();
        if (!file) {
            throw new FileUploadException('File not found');
        }

        const contentType = this.resolveType(file.filename, file.mimetype);
        const data = await file.toBuffer();
        if (file.file.truncated) {
            throw new FileUploadException('File exceeds the maximum allowed size');
        }

        const partNumber = file.fields?.partNumber as Record<string, any>
        const plantCode = file.fields?.plantCode as Record<string, any>

        const details: Record<string, string[]> = { messages: [] }

        if (!partNumber || typeof partNumber.value !== 'string')
            details.messages.push('partNumber is required');
        if (!plantCode || typeof plantCode.value !== 'string')
            details.messages.push('plantCode is required');
        if (details.messages.length)
            throw new InvalidPayload('Invalid payload for analyzing report', details);


        return this.reportSvc.submit({
            userId: user.userId,
            filename: file.filename,
            contentType,
            data,
            partNumber: partNumber.value,
            plantCode: plantCode.value,
        });
    }

    private resolveType(filename: string, mimetype: string): AllowedTypeValues {
        const byMime = this.ALLOWED_TYPES[mimetype];
        if (byMime) return byMime;

        const ext = filename.split('.').pop()?.toLowerCase();
        if (ext === ALLOWED_TYPES['text/csv']) return ALLOWED_TYPES['text/csv'];
        if (ext === ALLOWED_TYPES['application/json']) return ALLOWED_TYPES['application/json'];

        throw new FileUploadException('Only CSV or JSON files are accepted', { filename, mimetype });
    }

    private resolveStatus(status?: string): ReportStatus | undefined {
        if (!status) return;

        if (
            status !== ReportStatus.PENDING
            && status !== ReportStatus.FAILED
            && status !== ReportStatus.FINISHED
            && status !== ReportStatus.PROCESSING
        ) return;

        return status;
    }
}
