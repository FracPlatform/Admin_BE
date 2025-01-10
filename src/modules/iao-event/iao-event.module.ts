import { Module } from '@nestjs/common';
import { IaoEventService } from './iao-event.service';
import { IaoEventController } from './iao-event.controller';
import { DataServicesModule } from 'src/services';
import { IaoEventBuilderService } from './iao-event.factory.service';
import { S3Module } from 'src/s3/s3.module';
import { IaoRequestModule } from 'src/modules/iao-request/iao-request.module';
import { SocketGateway } from 'src/providers/socket/socket.gateway';
import { MailModule } from 'src/services/mail/mail.module';
import { EmailModule } from 'src/services/email/email.module';
import { CommonModule } from 'src/common-service/common.module';

@Module({
  imports: [
    DataServicesModule,
    S3Module,
    IaoRequestModule,
    MailModule,
    EmailModule,
    CommonModule,
  ],
  controllers: [IaoEventController],
  providers: [IaoEventService, IaoEventBuilderService, SocketGateway],
  exports: [IaoEventService],
})
export class IaoEventModule {}
