// Break the transitive import of the generated Prisma client - AnalyzeRepository is mocked below.
jest.mock('src/modules/shared/prisma.service', () => ({ PrismaService: class PrismaService { } }));
jest.mock('generated/prisma/client', () => ({
    Prisma: {},
    ReportStatus: { PENDING: 'PENDING', PROCESSING: 'PROCESSING', FINISHED: 'FINISHED', FAILED: 'FAILED' },
}));

import { Job, UnrecoverableError } from 'bullmq';
import { AnalysisProcessor } from './analysis.processor';
import { AnalysisResult } from '../analyze/schemas/analysis-result.schema';

describe('AnalysisProcessor', () => {
    let processor: AnalysisProcessor;
    let analyzeSvc: { analyze: jest.Mock };
    let analyzeRepo: {
        markProcessing: jest.Mock;
        findWithFile: jest.Mock;
        markFinished: jest.Mock;
        markFailed: jest.Mock;
        incrementErrorCount: jest.Mock;
    };

    const result: AnalysisResult = { success: true, summary: 's', defects: [], recommendedAction: 'a' };

    beforeEach(() => {
        analyzeSvc = { analyze: jest.fn() };
        analyzeRepo = {
            markProcessing: jest.fn(),
            findWithFile: jest.fn(),
            markFinished: jest.fn(),
            markFailed: jest.fn(),
            incrementErrorCount: jest.fn(),
        };
        processor = new AnalysisProcessor(analyzeSvc as any, analyzeRepo as any);
    });

    describe('process', () => {
        it('loads the file, analyzes it, and returns the structured result', async () => {
            analyzeRepo.findWithFile.mockResolvedValue({
                report: { fileData: { data: Uint8Array.from(Buffer.from('data')) } },
            });
            analyzeSvc.analyze.mockResolvedValue(result);

            const output = await processor.process({ data: { analysisId: 5 }, attemptsMade: 0 } as Job);

            expect(analyzeRepo.findWithFile).toHaveBeenCalledWith(5);
            expect(analyzeSvc.analyze).toHaveBeenCalled();
            expect(output).toBe(result);
        });

        it('throws when there is no file data (lets BullMQ retry)', async () => {
            analyzeRepo.findWithFile.mockResolvedValue({ report: { fileData: null } });

            await expect(
                processor.process({ data: { analysisId: 9 }, attemptsMade: 0 } as Job),
            ).rejects.toThrow();
            expect(analyzeSvc.analyze).not.toHaveBeenCalled();
        });

        it('throws UnrecoverableError (no retry) when the analysis reports invalid data', async () => {
            analyzeRepo.findWithFile.mockResolvedValue({
                report: { fileData: { data: Uint8Array.from(Buffer.from('garbage')) } },
            });
            analyzeSvc.analyze.mockResolvedValue({ success: false, recommendedAction: '' });

            await expect(
                processor.process({ data: { analysisId: 3 }, attemptsMade: 0 } as Job),
            ).rejects.toBeInstanceOf(UnrecoverableError);
        });
    });

    describe('lifecycle events', () => {
        it('marks PROCESSING when the job becomes active', async () => {
            await processor.onProcessing({ data: { analysisId: 5 }, attemptsMade: 0 } as Job);
            expect(analyzeRepo.markProcessing).toHaveBeenCalledWith(5);
        });

        it('marks FINISHED with the result when the job completes', async () => {
            await processor.onCompleted({ data: { analysisId: 5 } } as Job, result);
            expect(analyzeRepo.markFinished).toHaveBeenCalledWith(5, result);
        });

        it('increments errorCount on every failure but only marks FAILED on the final attempt', async () => {
            const job = { data: { analysisId: 7 }, attemptsMade: 1, opts: { attempts: 3 } } as Job;
            await processor.onFailed(job, new Error('boom'));

            expect(analyzeRepo.incrementErrorCount).toHaveBeenCalledWith(7);
            expect(analyzeRepo.markFailed).not.toHaveBeenCalled();
        });

        it('marks FAILED with the error message on the final attempt', async () => {
            const job = { data: { analysisId: 7 }, attemptsMade: 3, opts: { attempts: 3 } } as Job;
            await processor.onFailed(job, new Error('boom'));

            expect(analyzeRepo.incrementErrorCount).toHaveBeenCalledWith(7);
            expect(analyzeRepo.markFailed).toHaveBeenCalledWith(7, 'boom');
        });
    });
});
