import { Injectable, Logger } from '@nestjs/common';
import { ReportsRepository } from './reports.repository';
import { QueueService } from '../queue/queue.service';
import { ReportStatus } from 'generated/prisma/enums';
import { SubmitReportInput } from './interfaces/report.interfaces';


@Injectable()
export class ReportsService {
    private readonly logger = new Logger(ReportsService.name);

    constructor(
        private readonly reportsRepo: ReportsRepository,
        private readonly queueSvc: QueueService,
    ) { }

    async submit(input: SubmitReportInput) {
        const metadata = this.buildMetadata(input);

        const report = await this.reportsRepo.createWithAnalysis({
            userId: input.userId,
            filename: input.filename,
            partNumber: input.partNumber,
            plantCode: input.plantCode,
            data: input.data,
            metadata,
        });

        const analysisId = report.analysis!.id;
        await this.queueSvc.addToQueue(analysisId);
        this.logger.log(`Report #${report.id} submitted, analysis #${analysisId} queued`);

        return {
            reportId: report.id,
            analysisId,
            status: report.analysis!.status,
        };
    }

    async getAllReports(userId: number, status?: ReportStatus) {
        return this.reportsRepo.listReports(userId, status);
    }

    private buildMetadata(input: SubmitReportInput): Record<string, any> {
        const text = input.data.toString('utf-8');
        let recordCount: number | undefined;

        if (input.contentType === 'json') {
            try {
                const parsed = JSON.parse(text);
                recordCount = Array.isArray(parsed) ? parsed.length : undefined;
            } catch {
                recordCount = undefined;
            }
        } else {
            recordCount = text.split(/\r?\n/).filter((line) => line.trim().length > 0).length;
        }

        return {
            type: input.contentType,
            size: input.data.length,
            ...(recordCount !== undefined ? { recordCount } : {}),
        };
    }
}
