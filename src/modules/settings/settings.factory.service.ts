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
      custodianshipLabel: data.custodianshipLabel ? {
        physicalAsset: {
          en: data.custodianshipLabel?.physicalAsset?.en || currentSettings.custodianshipLabel.physicalAsset.en,
          cn: data.custodianshipLabel?.physicalAsset?.cn || currentSettings.custodianshipLabel.physicalAsset.cn,
          jp: data.custodianshipLabel?.physicalAsset?.ja || currentSettings.custodianshipLabel.physicalAsset.jp,
        },
        digitalAssetForNft:{
          en: data.custodianshipLabel?.digitalAssetForNft?.en || currentSettings.custodianshipLabel.digitalAssetForNft.en,
          cn: data.custodianshipLabel?.digitalAssetForNft?.cn || currentSettings.custodianshipLabel.digitalAssetForNft.cn,
          jp: data.custodianshipLabel?.digitalAssetForNft?.ja || currentSettings.custodianshipLabel.digitalAssetForNft.jp,
        },
        digitalAssetForNonNft:{
          en: data.custodianshipLabel?.digitalAssetForNonNft?.en || currentSettings.custodianshipLabel.digitalAssetForNonNft.en,
          cn: data.custodianshipLabel?.digitalAssetForNonNft?.cn || currentSettings.custodianshipLabel.digitalAssetForNonNft.cn,
          jp: data.custodianshipLabel?.digitalAssetForNonNft?.ja || currentSettings.custodianshipLabel.digitalAssetForNonNft.jp,
        },
      } : undefined,
    };
    return dataUpdate;
  }
}
