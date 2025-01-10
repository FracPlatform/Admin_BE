import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type ExchangeRateDocument = ExchangeRate & Document;

@Schema({
  timestamps: true,
  collection: 'ExchangeRate',
  versionKey: false,
})
export class ExchangeRate {
  @Prop({ type: String })
  contractAddress: string;

  @Prop({ type: String })
  symbol: string;

  @Prop({ type: Number })
  decimal: number;

  @Prop({ type: Number })
  exchangeRate: number;

  @Prop({ type: String })
  stringExchangeRate?: string;
}

export const ExchangeRateSchema = SchemaFactory.createForClass(ExchangeRate);
