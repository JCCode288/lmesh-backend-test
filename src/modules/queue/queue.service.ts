import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { AnalysisJob } from './interfaces/analysis-job.interface';
import {
  ANALYSIS_JOB_NAME,
  ANALYSIS_QUEUE_NAME,
} from 'src/utils/constants/queue.constant';

@Injectable()
export class QueueService {
  constructor(
    @InjectQueue(ANALYSIS_QUEUE_NAME)
    private readonly analysisQueue: Queue<AnalysisJob>,
  ) {}

  /**
   * @description method to adding job into queue.
   * @param analysisId analysis id for retrieving data and metadata inside processor
   */
  async addToQueue(analysisId: number) {
    return this.analysisQueue.add(ANALYSIS_JOB_NAME, { analysisId });
  }
}
