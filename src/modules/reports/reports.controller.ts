import { Controller, Get, HttpException, Post, Query, Req, UploadedFile } from '@nestjs/common';
import { ReportsService } from './reports.service';
import type { FastifyRequest } from 'fastify';
import { FileUploadException } from 'src/commons/exceptions/FileUploadException';
import { InvalidPayload } from 'src/commons/exceptions/InvalidPayload';


@Controller('reports')
/**
 * @description Single entry point for processing reports
 */
export class ReportsController {
    constructor(private readonly reportSvc: ReportsService) { }

    @Get("")
    /**
     * @description getting list of all reports can be filtered by status
     * @param {string} status parameter from FE for report filtering
     * 
     */
    async getAllReports(@Query('status') status: string) {
        try {

        } catch (err) {

        }
    }

    @Post("analyze")
    /**
     * @description accepting uploaded file to be inserted into queue process
     * @param {FastifyRequest} req request with body multipart body including file, partNumber, and plantCode 
     */
    async analyzeReport(@Req() req: FastifyRequest) {
        const file = await req.file();
        if (!file) throw new FileUploadException("File Not Found");

        const filename = file.filename;
        const { partNumber, plantCode } = req.body as any;
        if (!partNumber || !plantCode)
            throw new InvalidPayload("Invalid payload for analyzing report", { filename, partNumber, plantCode })

        const buffer = file?.toBuffer();
    }
}
