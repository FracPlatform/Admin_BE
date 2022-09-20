import { Module } from '@nestjs/common';
import { IaoRequestService } from './iao-request.service';
import { IaoRequestController } from './iao-request.controller';
import { DataServicesModule } from 'src/services';
import { IaoRequestBuilderService } from './iao-request.factory.service';

@Module({
  imports: [DataServicesModule],
  controllers: [IaoRequestController],
  providers: [IaoRequestService,IaoRequestBuilderService],
})
export class IaoRequestModule {}
