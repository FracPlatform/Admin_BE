import { Injectable, Logger } from '@nestjs/common';
import { ErrorCode } from 'src/common/constants';
import { IDataServices } from 'src/core/abstracts/data-services.abstract';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { ApiError } from 'src/common/api';
import { SETTINGS_NAME_DEFAULT } from 'src/datalayer/model';
import { UpdateSettingsDto } from './dto/settings.dto';
import { SettingsBuilderService } from './settings.factory.service';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    private readonly dataServices: IDataServices,
    private readonly settingsBuilderService: SettingsBuilderService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async getSettings() {
    const currentSettings = await this.dataServices.settings.findOne({
      settingsName: SETTINGS_NAME_DEFAULT,
    });
    if (!currentSettings) throw ApiError(ErrorCode.DEFAULT_ERROR, 'Settings invalid');

    return currentSettings;
  }

  async updateSettings(data: UpdateSettingsDto) {
    if (!Object.entries(data).length) throw ApiError(ErrorCode.DEFAULT_ERROR, 'No Data');   

    const currentSettings = await this.dataServices.settings.findOne({
      settingsName: SETTINGS_NAME_DEFAULT,
    });
    if (!currentSettings) throw ApiError(ErrorCode.DEFAULT_ERROR, 'Settings invalid');

    const updateSettings = await this.settingsBuilderService.updateSetting(currentSettings, data);
    
    return await this.dataServices.settings.findOneAndUpdate(
      {
        settingsName: SETTINGS_NAME_DEFAULT,
        updatedAt: currentSettings['updatedAt'],
      },
      updateSettings,
      { new: true },
    );
  }
}
