import { Module } from '@nestjs/common';
import { MongoServicesModule } from '../../datalayer/mongo-services.module';

@Module({
  imports: [MongoServicesModule],
  exports: [MongoServicesModule],
})
export class DataServicesModule {}
