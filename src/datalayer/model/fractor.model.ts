import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { CollectionItem, CollectionItemSchema } from './collection-item.model';
import { Phone } from './iao-request.model';
const paginate = require('mongoose-paginate-v2');
const aggregatePaginate = require('mongoose-aggregate-paginate-v2');

export type FractorDocument = Fractor & Document;

export enum AccountStatus {
  ACTIVE = 'active',
  DEACTIVE = 'deactive',
}

export enum SocialType {
  FB = 'facebook',
  TELEGRAM = 'telegram',
  DISCORD = 'discord',
  TWITTER = 'twitter',
}

@Schema({
  collection: 'FractorRevenue',
  timestamps: true,
})
export class FractorRevenue {
  @Prop({ type: Boolean })
  isWithdrawed: boolean;

  @Prop({ type: Number })
  balance: number;

  @Prop({ type: String })
  currencyContract: string;

  @Prop({ type: String })
  acceptedCurrencySymbol: string;

  @Prop({ type: String })
  fnftContractAddress: string;

  @Prop({ type: Number })
  exchangeRate: number;

  @Prop({ type: String })
  iaoEventId: string;

  @Prop({ type: Number, required: false })
  acceptedCurrencyUsdPrice?: number;
}

export const FractorRevenueSchema =
  SchemaFactory.createForClass(FractorRevenue);

export class SocialLink {
  @Prop({ type: String })
  type: string;

  @Prop({ type: String })
  url: string;
}

@Schema({
  timestamps: true,
  collection: 'Fractor',
})
export class Fractor {
  @Prop({ type: String })
  email: string;

  @Prop({ type: String })
  password: string;

  @Prop({ required: true, type: Boolean, default: false })
  verified: boolean;

  @Prop({ required: true, type: Boolean, default: false })
  kycStatus: boolean;

  @Prop({ type: Number, default: null })
  verificationCode: number;

  @Prop({ type: Date, default: null })
  verificationCodeExpireTime: Date;

  @Prop({ type: String, default: '' })
  fullname: string;

  @Prop({ type: String, default: '' })
  description: string;

  @Prop({ type: String, default: '' })
  avatar: string;

  @Prop({ type: Array, default: [] })
  socialLink: SocialLink[];

  @Prop({ type: String, default: '' })
  banner: string;

  @Prop({ type: String })
  socialFacebookId: string;

  @Prop({ type: String })
  referBy: string;

  @Prop({ type: [CollectionItemSchema] })
  collections: CollectionItem[];

  @Prop({ type: Boolean, default: false })
  isBlocked: boolean;

  @Prop({ type: String })
  fractorId?: string;

  @Prop({ type: String })
  assignedBD: string;

  @Prop({ type: Number, default: null })
  iaoFeeRate: number;

  @Prop({ type: Number, default: null })
  tradingFeeProfit: number;

  @Prop({ type: String })
  lastUpdatedBy: string;

  @Prop({ type: String })
  deactivationComment: string;

  @Prop({ type: String })
  deactivatedBy: string;

  @Prop({ type: Date, default: null })
  deactivetedOn: Date;

  @Prop({ type: Phone })
  contactPhone: Phone;

  @Prop({ type: String })
  walletAddress: string;

  @Prop({ type: String, default: '' })
  fractorAddress: string;

  @Prop({ type: [FractorRevenueSchema] })
  revenue: FractorRevenue[];
}

export const FractorSchema = SchemaFactory.createForClass(Fractor);
FractorSchema.plugin(paginate);
FractorSchema.plugin(aggregatePaginate);
FractorSchema.index({ fractorId: 1 });
FractorSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { houseName: { $type: 'string' } } },
);
