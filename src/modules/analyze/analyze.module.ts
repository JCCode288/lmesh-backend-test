import { Module } from '@nestjs/common';
import { AnalyzeService } from './analyze.service';
import { AgentService } from './agent.service';
import { AnalyzeRepository } from './analyze.repository';

@Module({
  providers: [AnalyzeService, AnalyzeRepository, AgentService],
  exports: [AnalyzeService, AnalyzeRepository],
})
export class AnalyzeModule {}
