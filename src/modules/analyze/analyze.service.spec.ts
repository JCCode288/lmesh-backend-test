import { Test, TestingModule } from '@nestjs/testing';
import { AnalyzeService } from './analyze.service';
import { AgentService } from './agent.service';
import { AnalysisResult } from './schemas/analysis-result.schema';

describe('AnalyzeService', () => {
    let service: AnalyzeService;
    let agent: { analyze: jest.Mock };

    const result: AnalysisResult = {
        success: true,
        summary: 'ok',
        defects: [{ code: 'D1', description: 'crack', severity: 'HIGH' }],
        recommendedAction: 'scrap',
    };

    beforeEach(async () => {
        agent = { analyze: jest.fn() };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AnalyzeService,
                { provide: AgentService, useValue: agent },
            ],
        }).compile();

        service = module.get<AnalyzeService>(AnalyzeService);
    });

    it('decodes the buffer and returns the structured result', async () => {
        agent.analyze.mockResolvedValue(result);

        const output = await service.analyze(Buffer.from('raw,data'));

        expect(output).toEqual(result);
        expect(agent.analyze).toHaveBeenCalledWith('raw,data');
    });

    it('propagates parse/model errors', async () => {
        agent.analyze.mockRejectedValue(new Error('unparseable output'));

        await expect(service.analyze(Buffer.from('x'))).rejects.toThrow('unparseable output');
    });
});
