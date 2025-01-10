import { Module } from '@nestjs/common';
import { IaoRequestService } from './iao-request.service';
import { IaoRequestController } from './iao-request.controller';
import { DataServicesModule } from 'src/services';
import { IaoRequestBuilderService } from './iao-request.factory.service';
import { SocketGateway } from 'src/providers/socket/socket.gateway';
import { MailModule } from 'src/services/mail/mail.module';
import { EmailModule } from 'src/services/email/email.module';
@Module({
  imports: [DataServicesModule, MailModule, EmailModule],
  controllers: [IaoRequestController],
  providers: [IaoRequestService, IaoRequestBuilderService, SocketGateway],
  exports: [IaoRequestBuilderService],
})
export class IaoRequestModule {}
