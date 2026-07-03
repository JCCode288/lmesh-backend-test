import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/shared/prisma.service';
import { Prisma, ReportStatus } from 'generated/prisma/client';
import { AnalysisResult } from './schemas/analysis-result.schema';

@Injectable()
export class AnalyzeRepository {
    constructor(private readonly prisma: PrismaService) { }

    findWithFile(id: number) {
        return this.prisma.analysis.findUnique({
            where: { id },
            include: { report: { include: { fileData: true } } },
        });
    }

    markProcessing(id: number) {
        return this.prisma.analysis.update({
            where: { id },
            data: { status: ReportStatus.PROCESSING, startedAt: new Date() },
        });
    }

    markFinished(id: number, result: AnalysisResult) {
        return this.prisma.analysis.update({
            where: { id },
            data: {
                status: ReportStatus.FINISHED,
                result: result as unknown as Prisma.InputJsonValue,
                finishedAt: new Date(),
            },
        });
    }

    markFailed(id: number, error: string) {
        return this.prisma.analysis.update({
            where: { id },
            data: { status: ReportStatus.FAILED, error },
        });
    }

    incrementErrorCount(id: number) {
        return this.prisma.analysis.update({
            where: { id },
            data: { errorCount: { increment: 1 } },
        });
    }
}
