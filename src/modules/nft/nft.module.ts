import { Module } from '@nestjs/common';
import { CommonModule } from 'src/common-service/common.module';
import { CommonService } from 'src/common-service/common.service';
import { DataServicesModule } from 'src/services';
import { NftController } from './nft.controller';
import { NftBuilderService } from './nft.factory.service';
import { NftService } from './nft.service';

@Module({
  imports: [DataServicesModule, CommonModule],
  providers: [NftService, NftBuilderService],
  controllers: [NftController],
})
export class NftModule {}
