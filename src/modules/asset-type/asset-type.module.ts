import { Module } from '@nestjs/common';
import { DataServicesModule } from 'src/services';
import { AssetTypeController } from './asset-type.controller';
import { AssetTypeService } from './asset-type.service';

@Module({
  imports: [DataServicesModule],
  providers: [AssetTypeService],
  controllers: [AssetTypeController],
})
export class AssetTypeModule {}
