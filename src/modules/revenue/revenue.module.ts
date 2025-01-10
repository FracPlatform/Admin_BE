import { Module } from '@nestjs/common';
import { SocketGateway } from 'src/providers/socket/socket.gateway';
import { DataServicesModule } from 'src/services';
import { MailService } from 'src/services/mail/mail.service';
import { IaoEventModule } from '../iao-event/iao-event.module';
import { IaoRequestModule } from '../iao-request/iao-request.module';
import { IaoRevenueController } from './revenue.controller';
import { IaoRevenueBuilderService } from './revenue.factory';
import { IaoRevenueService } from './revenue.service';

@Module({
  imports: [DataServicesModule, IaoEventModule, IaoRequestModule],
  controllers: [IaoRevenueController],
  providers: [
    IaoRevenueService,
    IaoRevenueBuilderService,
    SocketGateway,
    MailService,
  ],
})
export class IaoRevenueModule {}
