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
} from './model';
import { MongoServices } from './mongo-services.service';
import 'dotenv/config';
import { IAOEvent, IaoEventSchema } from './model/iao-event.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Fractor.name, schema: FractorSchema },
      { name: AssetType.name, schema: AssetTypeSchema },
      { name: Asset.name, schema: AssetSchema },
      { name: IAOEvent.name, schema: IaoEventSchema },
    ]),
    MongooseModule.forRoot(process.env.MONGODB_TEST_URI),
  ],
  providers: [
    {
      provide: IDataServices,
      useClass: MongoServices,
    },
  ],
  exports: [IDataServices],
})
export class MongoServicesTestModule {}
