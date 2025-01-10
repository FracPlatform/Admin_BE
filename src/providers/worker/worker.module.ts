import { TieringPoolModule } from './../../modules/tiering-pool/tiering-pool.module';
import { Module } from '@nestjs/common';
import { WorkerService } from './worker.service';
import { WorkerController } from './worker.controller';
import { CommonModule } from 'src/common-service/common.module';
import { DataServicesModule } from '../../services';
import { SocketGateway } from '../socket/socket.gateway';
import { MailService } from 'src/services/mail/mail.service';
import { WorkerFactoryService } from './worker-factory.service';
import { EmailModule } from 'src/services/email/email.module';
import { TasksModule } from '../schedule/tasks.module';
import { IaoRequestModule } from 'src/modules/iao-request/iao-request.module';
import { StakingHistoryModule } from 'src/modules/staking-history/staking-history.module';
import { S3Module } from 'src/s3/s3.module';

@Module({
  imports: [
    CommonModule,
    DataServicesModule,
    TasksModule,
    EmailModule,
    IaoRequestModule,
    TieringPoolModule,
    StakingHistoryModule,
    S3Module,
  ],
  controllers: [WorkerController],
  providers: [WorkerService, SocketGateway, MailService, WorkerFactoryService],
})
export class WorkerModule {}
