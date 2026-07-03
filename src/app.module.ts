import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AllExceptionsFilter } from './commons/filters/AllExceptionsFilter';
import { BullModule } from '@nestjs/bullmq';
import { QueueOptions } from 'bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SharedModule } from './modules/shared/shared.module';
import { AnalyzeModule } from './modules/analyze/analyze.module';
import { ReportsModule } from './modules/reports/reports.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configSvc: ConfigService) => {
        const bullConfig: QueueOptions = {
          connection: {
            host: configSvc.get('REDIS_HOST'),
            port: configSvc.get('REDIS_PORT'),
          }
        };

        return bullConfig;
      }
    }),
    SharedModule,
    AnalyzeModule,
    AuthModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule { }
