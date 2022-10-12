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
      custodianshipLable: data.custodianshipLable ? {
        physicalAsset: {
          en: data.custodianshipLable?.physicalAsset?.en || currentSettings.custodianshipLable.physicalAsset.en,
          cn: data.custodianshipLable?.physicalAsset?.cn || currentSettings.custodianshipLable.physicalAsset.cn,
          jp: data.custodianshipLable?.physicalAsset?.jp || currentSettings.custodianshipLable.physicalAsset.jp,
        },
        digitalAssetForNft:{
          en: data.custodianshipLable?.digitalAssetForNft?.en || currentSettings.custodianshipLable.digitalAssetForNft.en,
          cn: data.custodianshipLable?.digitalAssetForNft?.cn || currentSettings.custodianshipLable.digitalAssetForNft.cn,
          jp: data.custodianshipLable?.digitalAssetForNft?.jp || currentSettings.custodianshipLable.digitalAssetForNft.jp,
        },
        digitalAssetForNonNft:{
          en: data.custodianshipLable?.digitalAssetForNonNft?.en || currentSettings.custodianshipLable.digitalAssetForNonNft.en,
          cn: data.custodianshipLable?.digitalAssetForNonNft?.cn || currentSettings.custodianshipLable.digitalAssetForNonNft.cn,
          jp: data.custodianshipLable?.digitalAssetForNonNft?.jp || currentSettings.custodianshipLable.digitalAssetForNonNft.jp,
        },
      } : undefined,
    };
    return dataUpdate;
  }
}
