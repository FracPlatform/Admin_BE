import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
const paginate = require('mongoose-paginate-v2');
const aggregatePaginate = require('mongoose-aggregate-paginate-v2');

export type UserDocument = User & Document;

export enum USER_NFT_STATUS {
  OWNED = 4,
  REQUESTING = 5,
  PROCESSING = 6,
  REDEEMED = 7,
}

export const MAX_MASTER_COMMISION_RATE = 50;

export enum USER_LANGUAGE {
  EN = 'en',
  CD = 'cn',
  JA = 'ja',
}

export enum USER_ROLE {
  NORMAL = 1,
  MASTER_AFFILIATE = 2,
  AFFILIATE_SUB_1 = 3,
  AFFILIATE_SUB_2 = 4,
}

export class CreatedAffiliateBy {
  createdAt: Date;
  createdBy: string;
}

export class UpdatedAffiliateBy {
  updatedAt: Date;
  updatedBy: string;
}

export class DeactivatedAffiliateBy {
  deactivatedAt: Date;
  deactivatedBy: string;
  comment: string;
}

export enum USER_STATUS {
  ACTIVE = 1,
  INACTIVE = 2,
}
@Schema({
  collection: 'User',
})
export class User {
  @Prop({ type: String })
  walletAddress: string;

  @Prop({ type: Date, default: null })
  confirmationLinkExpireTime?: Date;

  @Prop({ type: Boolean, default: false })
  isEmailConfirmed?: boolean;

  @Prop({ type: String, required: false })
  referedBy?: string;

  @Prop({ type: Number })
  commissionRate: number;

  @Prop({ type: Number })
  maxSubFristCommissionRate: number;

  @Prop({ type: Number })
  maxSubSecondCommissionRate: number;

  @Prop({ type: String })
  bd?: string;

  @Prop({ type: Number })
  role: number;

  @Prop({ type: String, default: USER_LANGUAGE.EN })
  language?: string;

  @Prop({ type: String })
  referalCode?: string;

  @Prop({ type: String })
  userId?: string;

  @Prop({ type: Number })
  status?: number;

  @Prop({ type: CreatedAffiliateBy })
  createdAffiliateBy?: CreatedAffiliateBy;

  @Prop({ type: UpdatedAffiliateBy, default: null })
  updatedAffiliateBy?: UpdatedAffiliateBy;

  @Prop({ type: DeactivatedAffiliateBy, default: null })
  deactivatedAffiliateBy?: DeactivatedAffiliateBy;

  @Prop({ type: Date })
  createdAt?: Date;

  @Prop({ type: String })
  email?: string;

  @Prop({ type: String })
  description?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.plugin(paginate);
UserSchema.plugin(aggregatePaginate);
UserSchema.index({ userId: 1 });
UserSchema.index(
  { walletAddress: 1 },
  {
    unique: true,
  },
);
