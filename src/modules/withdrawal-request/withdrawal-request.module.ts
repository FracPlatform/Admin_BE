import { Module } from '@nestjs/common';
import { SocketGateway } from '../../providers/socket/socket.gateway';
import { DataServicesModule } from '../../services';
import { EmailModule } from '../../services/email/email.module';
import { MailService } from '../../services/mail/mail.service';
import { WithdrawalRequestController } from './withdrawal-request.controller';
import { WithdrawalRequestBuilderService } from './withdrawal-request.factory.service';
import { WithdrawalRequestService } from './withdrawal-request.service';

@Module({
  imports: [DataServicesModule, EmailModule],
  controllers: [WithdrawalRequestController],
  providers: [WithdrawalRequestService, WithdrawalRequestBuilderService, SocketGateway, MailService],
})
export class WithdrawalRequestModule {}
