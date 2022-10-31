import { Module } from '@nestjs/common';
import { DataServicesModule } from 'src/services';
import { IaoEventModule } from '../iao-event/iao-event.module';
import { IaoRevenueController } from './revenue.controller';
import { IaoRevenueBuilderService } from './revenue.factory';
import { IaoRevenueService } from './revenue.service';

@Module({
  imports: [DataServicesModule, IaoEventModule],
  controllers: [IaoRevenueController],
  providers: [IaoRevenueService, IaoRevenueBuilderService],
})
export class IaoRevenueModule {}
