import { Module } from '@nestjs/common';
import { IaoEventService } from './iao-event.service';
import { IaoEventController } from './iao-event.controller';
import { DataServicesModule } from 'src/services';
import { IaoEventBuilderService } from './iao-event.factory.service';

@Module({
  imports: [DataServicesModule],
  controllers: [IaoEventController],
  providers: [IaoEventService, IaoEventBuilderService],
})
export class IaoEventModule {}
