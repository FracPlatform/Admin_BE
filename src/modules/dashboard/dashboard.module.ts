import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { DataServicesModule } from 'src/services';
import { IaoEventModule } from '../iao-event/iao-event.module';

@Module({
  imports: [DataServicesModule, IaoEventModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
