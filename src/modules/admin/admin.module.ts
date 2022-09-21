import { Module } from '@nestjs/common';
import { DataServicesModule } from 'src/services';
import { AdminController } from './admin.controller';
import { AdminBuilderService } from './admin.factory.service';
import { AdminService } from './admin.service';

@Module({
  imports: [DataServicesModule],
  controllers: [AdminController],
  providers: [AdminService, AdminBuilderService],
})
export class AdminModule {}
