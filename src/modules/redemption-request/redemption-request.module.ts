import { Module } from '@nestjs/common';
import { DataServicesModule } from 'src/services';
import { RedemptionRequestController } from './redemption-request.controller';
import { RedemptionRequestBuilderService } from './redemption-request.factory.service';
import { RedemptionRequestService } from './redemption-request.service';

@Module({
  imports: [DataServicesModule],
  controllers: [RedemptionRequestController],
  providers: [RedemptionRequestService, RedemptionRequestBuilderService],
})
export class RedemptionRequestModule {}
