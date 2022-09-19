import { Module } from '@nestjs/common';
import { IaoRequestService } from './iao-request.service';
import { IaoRequestController } from './iao-request.controller';
import { DataServicesModule } from 'src/services';

@Module({
  imports: [DataServicesModule],
  controllers: [IaoRequestController],
  providers: [IaoRequestService],
})
export class IaoRequestModule {}
