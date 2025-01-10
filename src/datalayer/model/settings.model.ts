import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type SettingsDocument = Settings & Document;

export const SETTINGS_NAME_DEFAULT = 'SETING_DEFAULT';

export class Affiliate {
  registrationUrl: string;
  resourceUrl: string;
  telegramUrl: string;
  feedbackUrl: string;
}

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

export class WithdrawalThreshold {
  fractorMinWithdrawalThreshold: number;
  affiliateMinWithdrawalThreshold: number;
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

export class GasWallet {
  minThresholdIAO_BSC: number;
  minThresholdIAO_ETH: number;
  minThresholdDEX: number;
  mailNotified: string[];
}

export class Banner {
  @Prop({ type: String })
  url: string;

  @Prop({ type: Boolean, default: false })
  isActive?: boolean;

  @Prop({ type: String, default: null })
  hyperlink?: string;
}

@Schema({
  timestamps: true,
  collection: 'Settings',
})
export class Settings {
  @Prop({ type: String })
  settingsName: string;

  @Prop({ type: Affiliate })
  affiliate: Affiliate;

  @Prop({ type: AssetItem })
  assetItem: AssetItem;

  @Prop({ type: Custodianship })
  custodianship: Custodianship;

  @Prop({ type: IaoRequest })
  iaoRequest: IaoRequest;

  @Prop({ type: WithdrawalThreshold })
  withdrawalThreshold: WithdrawalThreshold;

  @Prop({ type: CustodianshipLabel })
  custodianshipLabel: CustodianshipLabel;

  @Prop({ type: Array<Banner>, default: [] })
  banner: Banner[];

  @Prop({ type: GasWallet })
  gasWallet: GasWallet;
}

export const SettingsSchema = SchemaFactory.createForClass(Settings);
