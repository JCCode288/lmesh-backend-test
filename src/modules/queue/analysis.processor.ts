import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job, UnrecoverableError } from 'bullmq';
import { AnalysisJob } from './interfaces/analysis-job.interface';
import { AnalyzeService } from '../analyze/analyze.service';
import { AnalyzeRepository } from '../analyze/analyze.repository';
import type { AnalysisResult } from '../analyze/schemas/analysis-result.schema';
import { ANALYSIS_QUEUE_NAME } from 'src/utils/constants/queue.constant';


@Processor(ANALYSIS_QUEUE_NAME)
export class AnalysisProcessor extends WorkerHost {
    private readonly logger = new Logger(AnalysisProcessor.name);

    constructor(
        private readonly analyzeSvc: AnalyzeService,
        private readonly analyzeRepo: AnalyzeRepository,
    ) {
        super();
    }

    async process(job: Job<AnalysisJob>) {
        const { analysisId } = job.data;
        this.logger.log(`Analyzing #${analysisId} (attempt ${job.attemptsMade + 1})`);

        const analysis = await this.analyzeRepo.findWithFile(analysisId);
        const fileData = analysis?.report?.fileData?.data;
        if (!fileData)
            throw new UnrecoverableError(`No file data found for analysis #${analysisId}`);

        const content = Buffer.from(fileData).toString("utf-8");

        if (!content)
            throw new UnrecoverableError(`File is empty for analysis #${analysisId}`);

        const result = await this.analyzeSvc.analyze(content);

        return result;
    }

    @OnWorkerEvent('active')
    async onProcessing(job: Job<AnalysisJob>) {
        const { analysisId } = job.data;

        await this.analyzeRepo.markProcessing(analysisId);
        this.logger.log(`Analyzing #${analysisId} (attempt ${job.attemptsMade + 1})`);
    }

    @OnWorkerEvent('completed')
    async onCompleted(job: Job<AnalysisJob>, result: AnalysisResult) {
        const { analysisId } = job.data;

        if (!result.success) {
            await this.analyzeRepo.markFailed(analysisId, result.summary || result.recommendedAction);
        } else {
            await this.analyzeRepo.markFinished(analysisId, result);
        }

        this.logger.log(`Analysis #${analysisId} finished`);
    }

    @OnWorkerEvent('failed')
    async onFailed(job: Job<AnalysisJob>, err: Error) {
        const { analysisId } = job.data;
        if (err instanceof UnrecoverableError) {
            this.logger.error(`Unrecoverable error for #${analysisId}`);

            await this.analyzeRepo.markFailed(analysisId, err.message);
            return;
        }

        await this.analyzeRepo.incrementErrorCount(analysisId);

        const maxAttempts = job.opts.attempts ?? 1;
        if (job.attemptsMade >= maxAttempts) {
            this.logger.error(`Analysis #${analysisId} failed permanently: ${err.message}`);

            await this.analyzeRepo.markFailed(analysisId, err.message);
        }

        this.logger.error(`Analysis #${analysisId} failing: ${err.message}. Retrying`);
    }
}
