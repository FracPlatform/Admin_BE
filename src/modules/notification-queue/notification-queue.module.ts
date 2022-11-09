import { Module } from '@nestjs/common';
import { DataServicesModule } from 'src/services';
import { NotificationQueueController } from './notification-queue.controller';
import { NotificationQueueBuilderService } from './notification-queue.factory.service';
import { NotificationQueueService } from './notification-queue.service';

@Module({
  imports: [DataServicesModule],
  controllers: [NotificationQueueController],
  providers: [NotificationQueueService, NotificationQueueBuilderService],
})
export class NotificationQueueModule {}
