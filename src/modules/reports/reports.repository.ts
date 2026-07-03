import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/shared/prisma.service';
import { Prisma, ReportStatus } from 'generated/prisma/client';

export interface CreateReportInput {
    userId: number;
    filename: string;
    partNumber: string;
    plantCode: string;
    data: Buffer;
    metadata: Record<string, any>;
}

@Injectable()
export class ReportsRepository {
    constructor(private readonly prisma: PrismaService) { }

    createWithAnalysis(input: CreateReportInput) {
        return this.prisma.reports.create({
            data: {
                partNumber: input.partNumber,
                plantCode: input.plantCode,
                filename: input.filename,
                createdBy: input.userId,
                fileData: {
                    create: {
                        data: Uint8Array.from(input.data),
                        metadata: input.metadata as Prisma.InputJsonValue,
                    },
                },
                analysis: { create: {} },
            },
            include: { analysis: true },
        });
    }

    findReportsById(id: number, userId: number) {
        return this.prisma.reports.findFirst({
            where: { id, createdBy: userId },
            include: { analysis: true },
        });
    }

    findReportWithFile(id: number, userId: number) {
        return this.prisma.reports.findFirst({
            where: { id, createdBy: userId },
            include: { fileData: true },
        });
    }

    listReports(userId: number, status?: ReportStatus) {
        return this.prisma.reports.findMany({
            where: {
                createdBy: userId,
                ...(status ? { analysis: { status } } : {}),
            },
            include: { analysis: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    deleteReports(userId: number, reportId: number) {
        return this.prisma.reports.delete({ where: { id: reportId, userId } })
    }
}
