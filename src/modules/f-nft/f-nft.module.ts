import { Module } from '@nestjs/common';
import { DataServicesModule } from 'src/services';
import { FnftController } from './f-nft.controller';
import { FnftBuilderService } from './f-nft.factory.service';
import { FnftService } from './f-nft.service';

@Module({
  imports: [DataServicesModule],
  controllers: [FnftController],
  providers: [FnftService, FnftBuilderService],
})
export class FnftModule {}
