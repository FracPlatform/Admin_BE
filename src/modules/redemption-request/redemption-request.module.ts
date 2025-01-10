import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MAX_BODY_LENGTH } from 'src/common/constants';
import { SocketGateway } from 'src/providers/socket/socket.gateway';
import { DataServicesModule } from 'src/services';
import { EmailModule } from 'src/services/email/email.module';
import { RedemptionRequestController } from './redemption-request.controller';
import { RedemptionRequestBuilderService } from './redemption-request.factory.service';
import { RedemptionRequestService } from './redemption-request.service';

@Module({
  imports: [
    DataServicesModule,
    EmailModule,
    HttpModule.register({
      maxBodyLength: MAX_BODY_LENGTH,
    }),
  ],
  controllers: [RedemptionRequestController],
  providers: [
    RedemptionRequestService,
    RedemptionRequestBuilderService,
    SocketGateway,
  ],
})
export class RedemptionRequestModule {}
