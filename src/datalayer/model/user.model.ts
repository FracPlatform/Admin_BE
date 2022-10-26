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

export enum USER_STATUS {
  ACTIVE = 1,
  INACTIVE = 2,
}
@Schema({
  timestamps: true,
  collection: 'User',
})
export class User {
  @Prop({ type: String })
  walletAddress: string;

  @Prop({ type: Number })
  masterCommissionRate: number;

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

  @Prop({ type: String, required: false })
  referedBy?: string;

  @Prop({ type: String })
  userId?: string;

  @Prop({ type: Number })
  status?: number;

  @Prop({ type: String })
  comment?: string;
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
