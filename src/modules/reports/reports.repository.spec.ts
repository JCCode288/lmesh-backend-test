jest.mock('src/modules/shared/prisma.service', () => ({ PrismaService: class PrismaService { } }));
jest.mock('generated/prisma/client', () => ({
    Prisma: {},
    ReportStatus: { PENDING: 'PENDING', PROCESSING: 'PROCESSING', FINISHED: 'FINISHED', FAILED: 'FAILED' },
}));

import { ReportsRepository } from './reports.repository';

describe('ReportsRepository', () => {
    let repo: ReportsRepository;
    let prisma: { reports: { create: jest.Mock; findFirst: jest.Mock; findMany: jest.Mock } };

    beforeEach(() => {
        prisma = {
            reports: { create: jest.fn(), findFirst: jest.fn(), findMany: jest.fn() },
        };
        repo = new ReportsRepository(prisma as any);
    });

    it('createWithAnalysis creates report + fileData + analysis atomically', async () => {
        await repo.createWithAnalysis({
            userId: 3,
            filename: 'f.json',
            partNumber: 'P1',
            plantCode: 'PL1',
            data: Buffer.from('x'),
            metadata: { type: 'json' },
        });

        expect(prisma.reports.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    partNumber: 'P1',
                    plantCode: 'PL1',
                    filename: 'f.json',
                    createdBy: 3,
                    fileData: { create: expect.objectContaining({ data: expect.any(Uint8Array) }) },
                    analysis: { create: {} },
                }),
                include: { analysis: true },
            }),
        );
    });

    it('findReportsById scopes the lookup to the owning user', async () => {
        await repo.findReportsById(5, 9);
        expect(prisma.reports.findFirst).toHaveBeenCalledWith({
            where: { id: 5, createdBy: 9 },
            include: { analysis: true },
        });
    });

    it('listReports filters by user only when no status is given', async () => {
        await repo.listReports(9);
        expect(prisma.reports.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ where: { createdBy: 9 } }),
        );
    });

    it('listReports filters by analysis status when provided', async () => {
        await repo.listReports(9, 'FAILED' as any);
        expect(prisma.reports.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ where: { createdBy: 9, analysis: { status: 'FAILED' } } }),
        );
    });
});
