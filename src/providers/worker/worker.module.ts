import { Module } from '@nestjs/common';
import { WorkerService } from './worker.service';
import { WorkerController } from './worker.controller';
import { CommonModule } from 'src/common-service/common.module';
import { DataServicesModule } from '../../services';

@Module({
  imports: [CommonModule, DataServicesModule],
  controllers: [WorkerController],
  providers: [WorkerService],
})
export class WorkerModule {}
