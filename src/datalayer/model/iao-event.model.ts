import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { FIAT_CURRENCY, FIAT_CURRENCY_LOGO } from './fiatPurchase.model';

export type IAOEventDocument = IAOEvent & Document;

export enum IAO_EVENT_CALENDER {
  REGISTRATION_START = 1,
  REGISTRATION_END = 2,
  PARTICIPATION_START = 3,
  PARTICIPATION_END = 4,
}

export enum IAO_EVENT_STAGE {
  UPCOMING = 1,
  REGISTER_NOW = 2,
  ON_SALE_SOON = 3,
  ON_SALE = 4,
  COMPLETED = 5,
  FAILED = 6,
}

export enum REVENUE_STATUS {
  PENDING = 0,
  IN_REVIEW = 1,
  APPROVED = 2,
  REJECTED = 3,
  CLOSED = 4,
}

export class Revenue {
  status: REVENUE_STATUS;
  platformCommissionRate?: number;
  bdCommissionRate: number;
  comment: string;
  finalizedBy?: string;
  finalizedOn?: Date;
  updatedBy: string;
  updatedAt: Date;
}

export const MAXLENGTH_CONTRACT_ADDRESS = 256;
export const MAX_IAO_EVENT_DURATION = 99;
export const MAXLENGTH_EVENT_NAME = 256;
export const MAXLENGTH_DESCRIPTION = 3000;
export const MAX_DECIMAL_HARD_CAP_PER_USER = 2;
export const MAX_HARD_CAP_PER_USER = 100;
export const MIN_HARD_CAP_PER_USER = 1;
export const MAX_DECIMAL_EXCHANGE_RATE = 18;
export const MAX_EXCHANGE_RATE = 999999999999;
export const MIN_EXCHANGE_RATE = 0;
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
  ja: string;
  cn: string;
  vi: string;
}

export class NotificationStatus {
  isWhitelistAnnounced: boolean;
  isParticipationStartAnnounced: boolean;
  isIaoEventSucceededAnnounced: boolean;
  isIaoEventFailedAnnounced: boolean;
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

  @Prop({ type: Boolean, default: false })
  allowWhitelist: boolean;

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

  @Prop({ type: Number })
  availableSupply: number;

  @Prop({ type: String })
  tokenSymbol: string;

  @Prop({ type: Boolean, default: false })
  isDeleted?: boolean;

  @Prop({ type: String })
  acceptedCurrencySymbol: string;

  @Prop({ type: Number })
  currencyDecimal: number;

  @Prop({ type: () => Revenue })
  revenue: Revenue;

  @Prop({ type: Boolean, default: false })
  isCron?: boolean;

  @Prop({ type: () => NotificationStatus, required: false })
  notificationStatus: NotificationStatus;

  @Prop({ type: String })
  fractorId: string;

  @Prop({ type: Date })
  failedOn: Date;

  @Prop({ type: Boolean })
  isAllFileDeleted: boolean;

  @Prop({ type: Boolean })
  allowStraits: boolean;

  @Prop({ type: Number })
  nftPriceSgd: number;

  @Prop({ type: Number })
  participatedByFiatAmount: number;

  @Prop({ type: Number })
  soldAmountByFiat: number;

  @Prop({ type: String })
  fiatSymbol: FIAT_CURRENCY;

  @Prop({ type: String })
  fiatLogoUrl: string;
}

export const IaoEventSchema = SchemaFactory.createForClass(IAOEvent);
IaoEventSchema.index({ iaoEventId: 1 }, { unique: true });
IaoEventSchema.index({ registrationStartTime: 1 });
IaoEventSchema.index({ registrationEndTime: 1 });
IaoEventSchema.index({ participationStartTime: 1 });
IaoEventSchema.index({ participationEndTime: 1 });
IaoEventSchema.index(
  { FNFTcontractAddress: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: false,
    },
  },
);
