import { Injectable } from '@nestjs/common';
import { AnalyzeService } from '../analyze/analyze.service';
import { QueueService } from '../queue/queue.service';

@Injectable()
export class ReportsService {
    constructor(
        private readonly analyzeSvc: AnalyzeService,
        private readonly queueSvc: QueueService
    ) { }


}
