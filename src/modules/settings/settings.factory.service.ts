import { Injectable } from '@nestjs/common';
import { UpdateSettingsDto } from './dto/settings.dto';

@Injectable()
export class SettingsBuilderService {

  updateSetting(currentSettings, data: UpdateSettingsDto) {
    const dataUpdate = {
      assetItem: data.assetItem ? { 
        maxFile: data.assetItem?.maxFile || currentSettings.assetItem.maxFile,
        maxSizeOfFile: data.assetItem?.maxSizeOfFile || currentSettings.assetItem.maxSizeOfFile,
      } : undefined,
      custodianship: data.custodianship ? {
        maxNFT: data.custodianship?.maxNFT || currentSettings.custodianship.maxNFT,
        maxFile: data.custodianship?.maxFile || currentSettings.custodianship.maxFile,
        maxSizeOfFile: data.custodianship?.maxSizeOfFile || currentSettings.custodianship.maxSizeOfFile,
      } : undefined,
      iaoRequest: data.iaoRequest ? {
        maxItem: data.iaoRequest?.maxItem || currentSettings.iaoRequest.maxItem,
      } : undefined,
    };
    return dataUpdate;
  }
}
