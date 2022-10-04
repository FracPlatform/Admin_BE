import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IDataServices } from '../core/abstracts/data-services.abstract';
import {
  Asset,
  AssetSchema,
  Fractor,
  FractorSchema,
  AssetType,
  AssetTypeSchema,
  Admin,
  AdminSchema,
  IAORequest,
  IAORequestSchema,
  CounterId,
  CounterIdSchema,
  Fnft,
  FnftSchema,
  IAOEvent,
  IaoEventSchema,
  Nft,
  NftSchema,
  Whitelist,
  WhitelistSchema,
} from './model';
import { MongoServices } from './mongo-services.service';
import 'dotenv/config';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Fractor.name, schema: FractorSchema },
      { name: Asset.name, schema: AssetSchema },
      { name: AssetType.name, schema: AssetTypeSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: IAORequest.name, schema: IAORequestSchema },
      { name: CounterId.name, schema: CounterIdSchema },
      { name: Fnft.name, schema: FnftSchema },
      { name: IAOEvent.name, schema: IaoEventSchema },
      { name: Nft.name, schema: NftSchema },
      { name: Whitelist.name, schema: WhitelistSchema },
    ]),
    MongooseModule.forRoot(process.env.MONGODB_URI),
  ],
  providers: [
    {
      provide: IDataServices,
      useClass: MongoServices,
    },
  ],
  exports: [IDataServices],
})
export class MongoServicesModule {}
