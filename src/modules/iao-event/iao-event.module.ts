import { Module } from '@nestjs/common';
import { IaoEventService } from './iao-event.service';
import { IaoEventController } from './iao-event.controller';
import { DataServicesModule } from 'src/services';
import { IaoEventBuilderService } from './iao-event.factory.service';
import { S3Module } from 'src/s3/s3.module';

@Module({
  imports: [DataServicesModule, S3Module],
  controllers: [IaoEventController],
  providers: [IaoEventService, IaoEventBuilderService],
  exports: [IaoEventService],
})
export class IaoEventModule {}
