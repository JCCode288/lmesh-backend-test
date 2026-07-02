import { Module } from '@nestjs/common';
import { AnalyzeService } from './analyze.service';
import { AgentService } from './agent.service';

@Module({
  providers: [AnalyzeService, AgentService],
})
export class AnalyzeModule { }
