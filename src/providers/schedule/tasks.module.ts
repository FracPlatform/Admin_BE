import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CommonModule } from 'src/common-service/common.module';

@Module({
  imports: [MongooseModule.forFeature([]), CommonModule],
  providers: [TasksService],
  exports: [],
})
export class TasksModule {}
