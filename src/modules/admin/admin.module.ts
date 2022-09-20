import { Module } from '@nestjs/common';
import { DataServicesModule } from 'src/services';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [DataServicesModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
