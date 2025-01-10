import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { DataServicesModule } from 'src/services';

@Module({
  imports: [DataServicesModule],
  controllers: [NotificationController],
  providers: [NotificationService],
})
export class NotificationModule {}
