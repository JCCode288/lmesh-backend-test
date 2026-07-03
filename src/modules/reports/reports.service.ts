import { Injectable, Logger } from '@nestjs/common';
import { ReportsRepository } from './reports.repository';
import { QueueService } from '../queue/queue.service';
import { ReportStatus } from 'generated/prisma/enums';
import {
  SubmitReportInput,
  SubmittedReport,
} from './interfaces/report.interfaces';
import { FileNotFoundException } from 'src/commons/exceptions/FileNotFoundException';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    private readonly reportsRepo: ReportsRepository,
    private readonly queueSvc: QueueService,
  ) {}

  /**
   * @description report submission to be analyzed. this method will create a record of reports (including analysis and fileData) and adding it into queue
   * @param {SubmitReportInput} input required body payload to submit report
   * @returns {SubmittedReport} queued report that can be used to track reports status
   */
  async submit(input: SubmitReportInput): Promise<SubmittedReport> {
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
    this.logger.log(
      `Report #${report.id} submitted, analysis #${analysisId} queued`,
    );

    return {
      reportId: report.id,
      analysisId,
      status: report.analysis!.status,
    };
  }
  /**
   * @description getting all reports based on user authenticated request. can be filtered by status
   * @param userId userid for filtering reports
   * @param status? status to be used for filtering reports, empty status means all status
   */
  async getAllReports(userId: number, status?: ReportStatus) {
    return this.reportsRepo.listReports(userId, status);
  }

  /**
   * @description downloading specific reports for an authenticated user
   * @param userId authenticated user id for filtering reports
   * @param reportId report id that connected to file data
   */
  async downloadFileData(userId: number, reportId: number) {
    const reportFile = await this.reportsRepo.findReportWithFile(
      reportId,
      userId,
    );

    if (!reportFile?.fileData?.data)
      throw new FileNotFoundException('File not found in database', {
        reportId,
      });

    return Buffer.from(reportFile.fileData.data);
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
      recordCount = text
        .split(/\r?\n/)
        .filter((line) => line.trim().length > 0).length;
    }

    return {
      type: input.contentType,
      size: input.data.length,
      ...(recordCount !== undefined ? { recordCount } : {}),
    };
  }
}
