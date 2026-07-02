import { Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { QueueRepository } from './queue.repository';

@Module({
  providers: [QueueService, QueueRepository]
})
export class QueueModule { }
