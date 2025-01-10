import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SGD_ICON, MYR_ICON, USD_ICON } from 'src/common/constants';

export type FiatPurchaseDocument = FiatPurchase & Document;

export enum FIAT_CURRENCY {
  USD = 'USD',
  SGD = 'SGD',
  MYR = 'MYR'
}

export const FIAT_CURRENCY_LOGO = {
  SGD: SGD_ICON,
  MYR: MYR_ICON,
  USD: USD_ICON
}

export enum FIAT_PURCHASE_STATUS {
  DRAF = 'Draf',
  PROCESSING = 'Processing',
  SUCCESSFUL = 'Successful',
  REFUNDED = 'Refunded',
  CANCELED = 'Canceled'
}

@Schema({
  timestamps: true,
  collection: 'FiatPurchase',
})
export class FiatPurchase {
  @Prop({ type: String })
  contractID?: string;

  @Prop({ type: String })
  iaoEventId: string;

  @Prop({ type: String })
  tokenAmount: string;

  @Prop({ type: String })
  tokenSymbol: string;

  @Prop({ type: String })
  funds: string;

  @Prop({ type: String })
  buyerAddress: string;

  @Prop({ type: String })
  trackId: string;

  @Prop({ type: String })
  idempotencyID?: string;

  @Prop({ type: String, default: FIAT_CURRENCY.SGD })
  currency: FIAT_CURRENCY;

  @Prop({ type: String })
  status: FIAT_PURCHASE_STATUS;

  @Prop({ type: String })
  transactionHash?: string;

  @Prop({ type: String })
  type?: string;

  @Prop({ type: String })
  fees?: string;

  @Prop({ type: String })
  referenceId?: string;

  @Prop({ type: String })
  bankShortCode?: string;

  @Prop({ type: String })
  accountNo?: string;

  @Prop({ type: String })
  endToEndRef?: string;

  @Prop({ type: Boolean, default: false })
  isMint: boolean;

  @Prop({ type: String,  default: ''  })
  rawTransaction: string

  @Prop({ type: Date })
  createdAt?: Date;
}

export const FiatPurchaseSchema = SchemaFactory.createForClass(FiatPurchase);
