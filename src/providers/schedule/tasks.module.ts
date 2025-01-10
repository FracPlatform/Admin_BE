import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CommonModule } from 'src/common-service/common.module';
import { DataServicesModule } from 'src/services';
import { SentNotificationTask } from './sent-notification.task';
import { MailService } from 'src/services/mail/mail.service';
import { IAOEventTask } from './iao-event.task';
import { MailModule } from 'src/services/mail/mail.module';
import { S3Module } from 'src/s3/s3.module';
import { SocketGateway } from '../socket/socket.gateway';
import { EmailModule } from 'src/services/email/email.module';
import { IaoRequestModule } from 'src/modules/iao-request/iao-request.module';
import { HttpModule } from '@nestjs/axios';
import { MAX_BODY_LENGTH } from 'src/common/constants';
import { GasWalletTask } from './gas-wallet.task';
import { ExchangeRateTask } from './exchang-rate.task';

@Module({
  imports: [
    DataServicesModule,
    CommonModule,
    MailModule,
    S3Module,
    EmailModule,
    IaoRequestModule,
    HttpModule.register({
      maxBodyLength: MAX_BODY_LENGTH,
    }),
  ],
  providers: [
    TasksService,
    SentNotificationTask,
    MailService,
    IAOEventTask,
    SocketGateway,
    GasWalletTask,
    ExchangeRateTask,
  ],
  exports: [SentNotificationTask],
})
export class TasksModule {}
