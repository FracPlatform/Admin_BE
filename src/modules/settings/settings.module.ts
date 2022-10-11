import { Module } from '@nestjs/common';
import { DataServicesModule } from 'src/services';
import { SettingsController } from './settings.controller';
import { SettingsBuilderService } from './settings.factory.service';
import { SettingsService } from './settings.service';

@Module({
  imports: [DataServicesModule],
  controllers: [SettingsController],
  providers: [SettingsService, SettingsBuilderService],
})
export class SettingsModule {}
