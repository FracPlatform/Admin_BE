import { Injectable } from '@nestjs/common';
import { ApiError } from 'src/common/api';
import { ErrorCode } from 'src/common/constants';
import { UpdateSettingsDto } from './dto/settings.dto';

@Injectable()
export class SettingsBuilderService {

  updateSetting(currentSettings, data: UpdateSettingsDto) {
    for (const key in data.custodianshipLabel) {
      for (const key2 in data.custodianshipLabel[key]) {
        if (key2 === 'en') {
          for (const key3 in data.custodianshipLabel[key][key2]) {
            if (!data.custodianshipLabel[key][key2][key3])
              throw ApiError(
                ErrorCode.DEFAULT_ERROR,
                `${key3} should not be empty`,
              );
          }
        }
      }
    }
    
    const dataUpdate = {
      affiliate: data.affiliate ? {
        registrationUrl: data.affiliate?.registrationUrl || currentSettings.affiliate.registrationUrl,
        resourceUrl: data.affiliate?.resourceUrl || currentSettings.affiliate.resourceUrl,
        telegramUrl: data.affiliate?.telegramUrl || currentSettings.affiliate.telegramUrl,
        feedbackUrl: data.affiliate?.feedbackUrl || currentSettings.affiliate.feedbackUrl,
      } : undefined,
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
      withdrawalThreshold: data.withdrawalThreshold ? {
        minWithdrawalThreshold: data.withdrawalThreshold?.minWithdrawalThreshold || currentSettings.withdrawalThreshold.minWithdrawalThreshold,
      } : undefined,
      custodianshipLabel: data.custodianshipLabel ? {
        physicalAsset: {
          en: data.custodianshipLabel?.physicalAsset?.en || currentSettings.custodianshipLabel.physicalAsset.en,
          cn: data.custodianshipLabel?.physicalAsset?.cn || currentSettings.custodianshipLabel.physicalAsset.cn,
          ja: data.custodianshipLabel?.physicalAsset?.ja || currentSettings.custodianshipLabel.physicalAsset.ja,
        },
        digitalAssetForNft:{
          en: data.custodianshipLabel?.digitalAssetForNft?.en || currentSettings.custodianshipLabel.digitalAssetForNft.en,
          cn: data.custodianshipLabel?.digitalAssetForNft?.cn || currentSettings.custodianshipLabel.digitalAssetForNft.cn,
          ja: data.custodianshipLabel?.digitalAssetForNft?.ja || currentSettings.custodianshipLabel.digitalAssetForNft.ja,
        },
        digitalAssetForNonNft:{
          en: data.custodianshipLabel?.digitalAssetForNonNft?.en || currentSettings.custodianshipLabel.digitalAssetForNonNft.en,
          cn: data.custodianshipLabel?.digitalAssetForNonNft?.cn || currentSettings.custodianshipLabel.digitalAssetForNonNft.cn,
          ja: data.custodianshipLabel?.digitalAssetForNonNft?.ja || currentSettings.custodianshipLabel.digitalAssetForNonNft.ja,
        },
      } : undefined,
    };
    return dataUpdate;
  }
}
