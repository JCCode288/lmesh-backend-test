import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService extends Redis implements OnModuleDestroy {
    constructor(config: ConfigService) {
        super({
            host: config.get<string>('REDIS_HOST', 'localhost'),
            port: parseInt(config.get<string>('REDIS_PORT', '6379'), 10),
            maxRetriesPerRequest: null,
        });
    }

    async onModuleDestroy() {
        await this.quit();
    }
}
