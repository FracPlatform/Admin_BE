import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
const paginate = require('mongoose-paginate-v2');
const aggregatePaginate = require('mongoose-aggregate-paginate-v2');

export type UserDocument = User & Document;

export enum USER_LANGUAGE {
  EN = 'en',
  CD = 'cn',
  JA = 'ja',
}

export enum USER_NFT_STATUS {
  OWNED = 4,
  REQUESTING = 5,
  PROCESSING = 6,
  REDEEMED = 7,
}
@Schema({
  timestamps: true,
  collection: 'User',
})
export class User {
  @Prop({ type: String })
  walletAddress: string;

  @Prop({ type: String, default: USER_LANGUAGE.EN })
  language?: string;

  @Prop({ type: String, required: false })
  referedBy?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.plugin(paginate);
UserSchema.plugin(aggregatePaginate);
