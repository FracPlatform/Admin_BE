import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type IAOEventDocument = IAOEvent & Document;

export const MAXLENGTH_CONTRACT_ADDRESS = 256;
export const MAX_IAO_EVENT_DURATION = 99;
export const MAXLENGTH_EVENT_NAME = 256;
export const MAXLENGTH_DESCRIPTION = 3000;
export const MAX_DECIMAL_HARD_CAP_PER_USER = 2;
export const MAX_HARD_CAP_PER_USER = 100;
export const MAX_DECIMAL_EXCHANGE_RATE = 18;
export const MAX_EXCHANGE_RATE = 999999999999;
export const MAX_LENGTH_WHITE_LIST_URL = 3000;

export enum VAULT_TYPE {
  VAULT = 1,
  NON_VAULT = 2,
}

export enum ON_CHAIN_STATUS {
  DRAFT = 1,
  ON_CHAIN = 2,
}

export enum IAO_EVENT_STATUS {
  ACTIVE = 1,
  INACTIVE = 2,
}

export enum ALLOCATION_TYPE {
  FIRST_COME_FIRST_SERVED = 1,
}

export class EventName {
  en: string;
  jp: string;
  cn: string;
}

@Schema({
  timestamps: true,
  collection: 'IAOEvent',
})
export class IAOEvent {
  @Prop({ type: String })
  iaoEventId: string;

  @Prop({ type: Boolean, default: false })
  isDisplay: boolean;

  @Prop({ type: Number })
  chainId: number;

  @Prop({ type: String })
  FNFTcontractAddress: string;

  @Prop({ type: String })
  iaoRequestId: string;

  @Prop({ type: Date })
  registrationStartTime: Date;

  @Prop({ type: Date })
  registrationEndTime: Date;

  @Prop({ type: Number })
  iaoEventDuration: number;

  @Prop({ type: Date })
  participationStartTime: Date;

  @Prop({ type: Date })
  participationEndTime: Date;

  @Prop({ type: Number })
  vaultType: number;

  @Prop({ type: String })
  acceptedCurrencyAddress: string;

  @Prop({ type: Number })
  exchangeRate: number;

  @Prop({ type: Number })
  percentageOffered: number;

  @Prop({ type: Number })
  vaultUnlockThreshold: number;

  @Prop({ type: String })
  eventPhotoUrl: string;

  @Prop({ type: String })
  eventBannerUrl: string;

  @Prop({ type: EventName })
  iaoEventName: EventName;

  @Prop({ type: EventName })
  description: EventName;

  @Prop({ type: Number })
  allocationType: number;

  @Prop({ type: Number })
  hardCapPerUser: number;

  @Prop({ type: String, default: null })
  whitelistRegistrationUrl: string;

  @Prop({ type: Date, default: null })
  whitelistAnnouncementTime: Date;

  @Prop({ type: Array, default: [] })
  whitelist?: string[];

  @Prop({ type: Number })
  onChainStatus: number;

  @Prop({ type: Number, default: IAO_EVENT_STATUS.ACTIVE })
  status?: number;

  @Prop({ type: String })
  updatedBy: string;

  @Prop({ type: String })
  createdBy: string;

  @Prop({ type: Date, default: null })
  createdOnChainAt?: Date;

  @Prop({ type: String, default: null })
  createdOnChainBy?: string;

  @Prop({ type: Date, default: null })
  lastWhitelistUpdatedAt?: Date;

  @Prop({ type: String, default: null })
  lastWhitelistUpdatedBy?: string;

  @Prop({ type: Number })
  totalSupply: number;

  @Prop({ type: Boolean, default: false })
  isDeleted?: boolean;
}

export const IaoEventSchema = SchemaFactory.createForClass(IAOEvent);
IaoEventSchema.index({ iaoEventId: 1 });
IaoEventSchema.index({ FNFTcontractAddress: 1 }, { unique: true });
