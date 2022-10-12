import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type SettingsDocument = Settings & Document;

export const SETTINGS_NAME_DEFAULT = 'SETING_DEFAULT';

export class AssetItem {
  maxFile: number;
  maxSizeOfFile: number;
}

export class Custodianship {
  maxNFT: number;
  maxFile: number;
  maxSizeOfFile: number;
}

export class IaoRequest {
  maxItem: number;
}

export class CustodianshipLable {
  physicalAsset: PhysicalAsset;
  digitalAssetForNft: DigitalAsset;
  digitalAssetForNonNft: DigitalAsset;
}

export class PhysicalAsset {
  en: PhysicalAssetLable;
  cn: PhysicalAssetLable;
  jp: PhysicalAssetLable;
}

export class PhysicalAssetLable {
  fractor: string;
  fractorToFrac: string;
  frac: string;
  availableForFractorToRedeem: string;
  fractorRedeems: string;
  fracToFractor: string;
  availableForUserToRedeem: string;
  userRedeems: string;
  fracToUser: string;
  user: string;
}

export class DigitalAsset {
  en: DigitalAssetLable;
  cn: DigitalAssetLable;
  jp: DigitalAssetLable;
}

export class DigitalAssetLable {
  fractor: string;
  fractorToFrac: string;
  frac: string;
  availableForFractorToRedeem: string;
  availableForUsertoRedeem: string;
  user: string;
}

@Schema({
  timestamps: true,
  collection: 'Settings',
})
export class Settings {
  @Prop({ type: String })
  settingsName: string;

  @Prop({ type: AssetItem })
  assetItem: AssetItem;

  @Prop({ type: Custodianship })
  custodianship: Custodianship;

  @Prop({ type: IaoRequest })
  iaoRequest: IaoRequest;

  @Prop({ type: CustodianshipLable })
  custodianshipLable: CustodianshipLable;
}

export const SettingsSchema = SchemaFactory.createForClass(Settings);
