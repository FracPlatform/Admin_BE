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
}

export const SettingsSchema = SchemaFactory.createForClass(Settings);
