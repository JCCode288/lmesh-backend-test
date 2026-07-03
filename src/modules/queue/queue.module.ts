import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { AnalysisProcessor } from './analysis.processor';
import { AnalyzeModule } from '../analyze/analyze.module';
import { ANALYSIS_QUEUE_NAME } from 'src/utils/constants/queue.constant';

@Module({
  imports: [
    AnalyzeModule,
    BullModule.registerQueue({
      name: ANALYSIS_QUEUE_NAME,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnFail: false,
      },
    }),
  ],
  providers: [QueueService, AnalysisProcessor],
  exports: [QueueService],
})
export class QueueModule {}
