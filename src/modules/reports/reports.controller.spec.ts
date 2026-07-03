jest.mock('src/modules/shared/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));
jest.mock('generated/prisma/client', () => ({
  Prisma: {},
  ReportStatus: {
    PENDING: 'PENDING',
    PROCESSING: 'PROCESSING',
    FINISHED: 'FINISHED',
    FAILED: 'FAILED',
  },
}));

import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { FileUploadException } from 'src/commons/exceptions/FileUploadException';
import { InvalidPayload } from 'src/commons/exceptions/InvalidPayload';

describe('ReportsController', () => {
  let controller: ReportsController;
  let reportSvc: { submit: jest.Mock; getAllReports: jest.Mock };

  const user = { userId: 7, username: 'alice' };

  const buildFile = (over: Record<string, any> = {}) => ({
    filename: 'inspection.json',
    mimetype: 'application/json',
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('[{"x":1}]')),
    file: { truncated: false },
    fields: { partNumber: { value: 'P1' }, plantCode: { value: 'PL1' } },
    ...over,
  });

  const buildReq = (file: any) =>
    ({ file: jest.fn().mockResolvedValue(file) }) as any;

  beforeEach(() => {
    reportSvc = { submit: jest.fn(), getAllReports: jest.fn() };
    controller = new ReportsController(reportSvc as unknown as ReportsService);
  });

  describe('analyzeReport', () => {
    it('submits a valid upload', async () => {
      reportSvc.submit.mockResolvedValue({
        reportId: 1,
        analysisId: 10,
        status: 'PENDING',
      });

      const result = await controller.analyzeReport(
        buildReq(buildFile()),
        user as any,
      );

      expect(result).toEqual({
        reportId: 1,
        analysisId: 10,
        status: 'PENDING',
      });
      expect(reportSvc.submit).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 7,
          contentType: 'json',
          partNumber: 'P1',
          plantCode: 'PL1',
        }),
      );
    });

    it('rejects when no file is present', async () => {
      await expect(
        controller.analyzeReport(buildReq(undefined), user as any),
      ).rejects.toBeInstanceOf(FileUploadException);
    });

    it('rejects a file that exceeds the size limit', async () => {
      const file = buildFile({ file: { truncated: true } });
      await expect(
        controller.analyzeReport(buildReq(file), user as any),
      ).rejects.toBeInstanceOf(FileUploadException);
    });

    it('rejects when partNumber/plantCode are missing', async () => {
      const file = buildFile({ fields: {} });
      await expect(
        controller.analyzeReport(buildReq(file), user as any),
      ).rejects.toBeInstanceOf(InvalidPayload);
      expect(reportSvc.submit).not.toHaveBeenCalled();
    });
  });

  describe('resolveType (private)', () => {
    const resolve = (filename: string, mimetype: string) =>
      (controller as any).resolveType(filename, mimetype);

    it('maps by mimetype', () => {
      expect(resolve('x', 'text/csv')).toBe('csv');
      expect(resolve('x', 'application/json')).toBe('json');
    });

    it('falls back to file extension', () => {
      expect(resolve('data.csv', 'application/octet-stream')).toBe('csv');
      expect(resolve('data.json', 'application/octet-stream')).toBe('json');
    });

    it('throws on an unsupported type', () => {
      expect(() => resolve('data.txt', 'text/plain')).toThrow(
        FileUploadException,
      );
    });
  });

  describe('resolveStatus (private)', () => {
    const resolve = (status: string) =>
      (controller as any).resolveStatus(status);

    it('returns valid statuses', () => {
      expect(resolve('PENDING')).toBe('PENDING');
      expect(resolve('PROCESSING')).toBe('PROCESSING');
      expect(resolve('FAILED')).toBe('FAILED');
    });

    it('returns undefined for empty or unknown values', () => {
      expect(resolve('')).toBeUndefined();
      expect(resolve('NONSENSE')).toBeUndefined();
    });
  });

  describe('getAllReports', () => {
    it('passes the resolved status filter to the service', async () => {
      reportSvc.getAllReports.mockResolvedValue([]);
      await controller.getAllReports(user as any, 'PROCESSING');
      expect(reportSvc.getAllReports).toHaveBeenCalledWith(7, 'PROCESSING');
    });
  });
});
