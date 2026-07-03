import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { QueueService } from './queue.service';
import { ANALYSIS_JOB_NAME, ANALYSIS_QUEUE_NAME } from 'src/utils/constants/queue.constant';

describe('QueueService', () => {
  let service: QueueService;
  let queue: { add: jest.Mock };

  beforeEach(async () => {
    queue = { add: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueService,
        { provide: getQueueToken(ANALYSIS_QUEUE_NAME), useValue: queue },
      ],
    }).compile();

    service = module.get<QueueService>(QueueService);
  });

  it('adds an analyze job carrying the analysis id', async () => {
    await service.addToQueue(77);
    expect(queue.add).toHaveBeenCalledWith(ANALYSIS_JOB_NAME, { analysisId: 77 });
  });
});
