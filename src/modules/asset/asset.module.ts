import { Module } from '@nestjs/common';
import { AssetService } from './asset.service';
import { AssetController } from './asset.controller';
import { AssetBuilderService } from './asset.factory.service';
import { DataServicesModule } from 'src/services';

@Module({
  imports: [DataServicesModule],
  controllers: [AssetController],
  providers: [AssetService, AssetBuilderService]
})
export class AssetModule { }
