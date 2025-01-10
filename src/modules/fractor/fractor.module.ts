import { Module } from '@nestjs/common';
import { FractorService } from './fractor.service';
import { FractorController } from './fractor.controller';
import { DataServicesModule } from '../../services';
import { FractorBuilderService } from './fractor.factory';
import { EmailModule } from 'src/services/email/email.module';

@Module({
  imports: [DataServicesModule, EmailModule],
  providers: [FractorService, FractorBuilderService],
  controllers: [FractorController],
})
export class FractorModule {}
