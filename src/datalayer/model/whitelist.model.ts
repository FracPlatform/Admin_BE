import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type WhitelistDocument = Whitelist & Document;

export class Address {
  @Prop({ type: String })
  walletAddress: string;

  @Prop({ type: Number })
  deposited: number;

  @Prop({ type: Number })
  purchased: number;
}

@Schema({
  timestamps: true,
  collection: 'Whitelist',
})
export class Whitelist {
  @Prop({ type: String })
  iaoEventId: string;

  @Prop({ type: Array })
  walletAddress: Address[];
}

export const WhitelistSchema = SchemaFactory.createForClass(Whitelist);
