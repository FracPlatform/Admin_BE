import { Module } from '@nestjs/common';
import { WorkerService } from './worker.service';
import { WorkerController } from './worker.controller';
import { CommonModule } from 'src/common-service/common.module';
import { DataServicesModule } from '../../services';
import { SocketGateway } from '../socket/socket.gateway';

@Module({
  imports: [CommonModule, DataServicesModule],
  controllers: [WorkerController],
  providers: [WorkerService, SocketGateway],
})
export class WorkerModule {}
