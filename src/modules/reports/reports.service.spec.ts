import { Test, TestingModule } from '@nestjs/testing';

// Break the transitive import of the generated Prisma client - ReportsRepository is mocked below.
jest.mock('src/modules/shared/prisma.service', () => ({ PrismaService: class PrismaService { } }));
jest.mock('generated/prisma/client', () => ({
    Prisma: {},
    ReportStatus: { PENDING: 'PENDING', PROCESSING: 'PROCESSING', FINISHED: 'FINISHED', FAILED: 'FAILED' },
}));

import { ReportsService } from './reports.service';
import { ReportsRepository } from './reports.repository';
import { QueueService } from '../queue/queue.service';

describe('ReportsService', () => {
    let service: ReportsService;
    let reportsRepo: { createWithAnalysis: jest.Mock; listReports: jest.Mock };
    let queueSvc: { addToQueue: jest.Mock };

    beforeEach(async () => {
        reportsRepo = { createWithAnalysis: jest.fn(), listReports: jest.fn() };
        queueSvc = { addToQueue: jest.fn() };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ReportsService,
                { provide: ReportsRepository, useValue: reportsRepo },
                { provide: QueueService, useValue: queueSvc },
            ],
        }).compile();

        service = module.get<ReportsService>(ReportsService);
    });

    describe('submit', () => {
        it('creates the report + analysis then queues the analysis job', async () => {
            reportsRepo.createWithAnalysis.mockResolvedValue({
                id: 1,
                analysis: { id: 10, status: 'PENDING' },
            });

            const result = await service.submit({
                userId: 3,
                filename: 'inspection.json',
                contentType: 'json',
                data: Buffer.from('[{"x":1}]'),
                partNumber: 'P1',
                plantCode: 'PL1',
            });

            expect(result).toEqual({ reportId: 1, analysisId: 10, status: 'PENDING' });
            expect(reportsRepo.createWithAnalysis).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: 3,
                    partNumber: 'P1',
                    plantCode: 'PL1',
                    metadata: expect.objectContaining({ type: 'json', recordCount: 1 }),
                }),
            );
            expect(queueSvc.addToQueue).toHaveBeenCalledWith(10);
        });

        it('counts CSV rows in metadata', async () => {
            reportsRepo.createWithAnalysis.mockResolvedValue({ id: 2, analysis: { id: 20, status: 'PENDING' } });

            await service.submit({
                userId: 1,
                filename: 'f.csv',
                contentType: 'csv',
                data: Buffer.from('a,b\n1,2\n3,4'),
                partNumber: 'P',
                plantCode: 'PL',
            });

            expect(reportsRepo.createWithAnalysis).toHaveBeenCalledWith(
                expect.objectContaining({ metadata: expect.objectContaining({ type: 'csv', recordCount: 3 }) }),
            );
        });

        it('queues only after the records are created', async () => {
            const order: string[] = [];
            reportsRepo.createWithAnalysis.mockImplementation(async () => {
                order.push('create');
                return { id: 1, analysis: { id: 10, status: 'PENDING' } };
            });
            queueSvc.addToQueue.mockImplementation(async () => {
                order.push('enqueue');
            });

            await service.submit({
                userId: 1,
                filename: 'f.csv',
                contentType: 'csv',
                data: Buffer.from('a,b\n1,2'),
                partNumber: 'P',
                plantCode: 'PL',
            });

            expect(order).toEqual(['create', 'enqueue']);
        });
    });

    describe('getAllReports', () => {
        it('delegates to the repository with the user id and status filter', async () => {
            const reports = [{ id: 1 }];
            reportsRepo.listReports.mockResolvedValue(reports);

            const result = await service.getAllReports(5, 'PENDING' as any);

            expect(result).toBe(reports);
            expect(reportsRepo.listReports).toHaveBeenCalledWith(5, 'PENDING');
        });
    });
});
