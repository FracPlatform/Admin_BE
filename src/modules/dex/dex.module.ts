import { Module } from '@nestjs/common';
import { DexController } from './dex.controller';
import { DexService } from './dex.service';

@Module({
  controllers: [DexController],
  providers: [DexService]
})
export class DexModule {}
