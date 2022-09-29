import { Module } from '@nestjs/common';
import { CommonModule } from 'src/common-service/common.module';
import { S3Module } from 'src/s3/s3.module';
import { DataServicesModule } from 'src/services';
import { NftController } from './nft.controller';
import { NftBuilderService } from './nft.factory.service';
import { NftService } from './nft.service';

@Module({
  imports: [DataServicesModule, CommonModule, S3Module],
  providers: [NftService, NftBuilderService],
  controllers: [NftController],
})
export class NftModule {}
