import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type WhitelistDocument = Whitelist & Document;

@Schema({
  timestamps: true,
  collection: 'Whitelist',
})
export class Whitelist {
  @Prop({ type: String })
  walletAddress: string;

  @Prop({ type: Array, default: [] })
  iaoEventId: string[];
}

export const WhitelistSchema = SchemaFactory.createForClass(Whitelist);
