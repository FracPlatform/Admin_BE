import { Module } from '@nestjs/common';
import { MongoServicesTestModule } from '../../datalayer/mongo-services-test.module';

@Module({
  imports: [MongoServicesTestModule],
  exports: [MongoServicesTestModule],
})
export class DataServicesTestModule {}
