import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CommonModule } from 'src/common-service/common.module';
import { DataServicesModule } from 'src/services';
import { SentNotificationTask } from './sent-notification.task';
import { MailService } from 'src/services/mail/mail.service';
import { IAOEventTask } from './iao-event.task';

@Module({
  imports: [DataServicesModule, CommonModule],
  providers: [TasksService, SentNotificationTask, MailService, IAOEventTask],
  exports: [],
})
export class TasksModule {}
