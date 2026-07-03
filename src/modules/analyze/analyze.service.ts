import { Injectable } from '@nestjs/common';
import { AgentService } from './agent.service';
import { AnalysisResult } from './schemas/analysis-result.schema';

@Injectable()
export class AnalyzeService {
  constructor(private readonly agent: AgentService) {}

  /**
   * @description proxy method to passing analyze data to agent
   * @param content stringified json/csv data to be analyzed
   */
  async analyze(content: string): Promise<AnalysisResult> {
    return this.agent.analyze(content);
  }
}
