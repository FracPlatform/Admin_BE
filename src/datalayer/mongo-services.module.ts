import { Module } from '@nestjs/common';
import { MongooseModule, getConnectionToken } from '@nestjs/mongoose';
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
} from './model';
import { MongoServices } from './mongo-services.service';
import 'dotenv/config';
import { Connection } from 'mongoose';
import * as AutoIncrementFactory from 'mongoose-sequence';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Fractor.name, schema: FractorSchema },
      { name: Asset.name, schema: AssetSchema },
      { name: Admin.name, schema: AdminSchema },
    ]),
    MongooseModule.forRoot(process.env.MONGODB_URI),
    MongooseModule.forFeatureAsync([
      {
        name: AssetType.name,
        useFactory: async (connection: Connection) => {
          const schema = AssetTypeSchema;
          const AutoIncrement = AutoIncrementFactory(connection);
          schema.plugin(AutoIncrement, { inc_field: 'typeId' });
          return schema;
        },
        inject: [getConnectionToken()],
      },
      {
        name: Admin.name,
        useFactory: (connection: Connection) => {
          const AutoIncrement = AutoIncrementFactory(connection);
          const schema = AdminSchema;
          schema.plugin(AutoIncrement, {
            inc_field: 'idcounter',
            start_seq: 1,
          });
          return schema;
        },
        inject: [getConnectionToken()],
      },
    ]),
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
