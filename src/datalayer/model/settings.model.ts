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

export class CustodianshipLabel {
  physicalAsset: PhysicalAsset;
  digitalAssetForNft: DigitalAsset;
  digitalAssetForNonNft: DigitalAsset;
}

export class PhysicalAsset {
  en: PhysicalAssetLable;
  cn: PhysicalAssetLable;
  ja: PhysicalAssetLable;
}

export class PhysicalAssetLable {
  0: string;
  1: string;
  2: string;
  3: string;
  4: string;
  5: string;
  6: string;
  7: string;
  8: string;
  9: string;
}

export class DigitalAsset {
  en: DigitalAssetLable;
  cn: DigitalAssetLable;
  ja: DigitalAssetLable;
}

export class DigitalAssetLable {
  0: string;
  1: string;
  2: string;
  3: string;
  6: string;
  9: string;
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

  @Prop({ type: CustodianshipLabel })
  custodianshipLable: CustodianshipLabel;
}

export const SettingsSchema = SchemaFactory.createForClass(Settings);
