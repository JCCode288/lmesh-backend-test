import { Injectable } from '@nestjs/common';
import { AgentService } from './agent.service';
import { AnalysisResult } from './schemas/analysis-result.schema';

@Injectable()
export class AnalyzeService {
    constructor(private readonly agent: AgentService) { }

    async analyze(content: string): Promise<AnalysisResult> {
        return this.agent.analyze(content);
    }
}
