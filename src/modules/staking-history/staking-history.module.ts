import { Module } from '@nestjs/common';
import { DataServicesModule } from 'src/services';
import { StakingHistoryController } from './staking-history.controller';
import { StakingHistoryService } from './staking-history.service';

@Module({
  imports: [DataServicesModule],
  controllers: [StakingHistoryController],
  providers: [StakingHistoryService],
  exports: [StakingHistoryService],
})
export class StakingHistoryModule {}
