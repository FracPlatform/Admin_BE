import { Module } from '@nestjs/common';
import { DataServicesModule } from 'src/services';
import { TieringPoolController } from './tiering-pool.controller';
import { TieringPoolService } from './tiering-pool.service';

@Module({
  imports: [DataServicesModule],
  controllers: [TieringPoolController],
  providers: [TieringPoolService],
  exports: [TieringPoolService],
})
export class TieringPoolModule {}
