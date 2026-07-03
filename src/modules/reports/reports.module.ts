import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsRepository } from './reports.repository';
import { ReportsController } from './reports.controller';
import { AnalyzeModule } from '../analyze/analyze.module';
import { QueueModule } from '../queue/queue.module';
import { SharedModule } from '../shared/shared.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [QueueModule, AnalyzeModule, SharedModule, AuthModule],
  providers: [ReportsService, ReportsRepository],
  controllers: [ReportsController],
})
export class ReportsModule {}
