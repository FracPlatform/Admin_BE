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
} from './model';
import { MongoServices } from './mongo-services.service';
import 'dotenv/config';
import { IAOEvent, IaoEventSchema } from './model/iao-event.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Fractor.name, schema: FractorSchema },
      { name: Asset.name, schema: AssetSchema },
      { name: AssetType.name, schema: AssetTypeSchema},
      { name: Admin.name, schema: AdminSchema },
      { name: IAORequest.name, schema: IAORequestSchema },
      { name: CounterId.name, schema: CounterIdSchema },
      { name: Fnft.name, schema: FnftSchema },
      { name: IAOEvent.name, schema: IaoEventSchema },
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
