import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type IAORequestDocument = IAORequest & Document;

export class ApprovedBy {
  adminId: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum IAO_REQUEST_TYPE {
  VAULT = 1,
  NON_VAULT = 2,
}

export const MAX_IAO_REQUEST_NOTE = 3000;
export const MAX_LENGTH_PHONE = 16;
export const MAX_IAO_REQUEST_ADDRESS = 512;
export const MAX_PERCENT_VAULT = 100;
export const MIN_TOTAL_SUPPLY = 10000;
export const MAX_PERCENT_OFFERED = 100;
export const MIN_IAO_EVENT_DURATION = 2;

export enum CURRENCY_UNIT {
  USD = 'usd',
  JPY = 'jpy',
  CNY = 'cny',
  SGD = 'sgd',
}

export enum IAO_REQUEST_STATUS {
  DRAFT = 1,
  IN_REVIEW = 2,
  REJECTED = 3,
  APPROVED_A = 4,
  APPROVED_B = 5,
  CLOSED = 6,
}

export class AssetValuation {
  currencyUnit: string;
  price: number;
}

export class Phone {
  countryCode: string;
  phone: string;
}

@Schema({
  timestamps: true,
  collection: 'IAORequest',
})
export class IAORequest {
  @Prop([{ type: String }])
  items: string[];

  @Prop({ type: AssetValuation })
  assetValuation: AssetValuation;

  @Prop({ type: Number })
  totalSupply: number;

  @Prop({ type: Number })
  percentOffered: number;

  @Prop({ type: Number })
  eventDuration: number;

  @Prop({ type: Number })
  percentVault: number;

  @Prop({ type: String })
  walletAddress: string;

  @Prop({ type: Phone })
  phone: Phone;

  @Prop({ type: String })
  note: string;

  @Prop({ type: Number })
  status: number;

  @Prop({ type: Number })
  type: number;

  @Prop({ type: String })
  ownerId: string;

  @Prop({ type: Number })
  usdPrice: number;

  @Prop({ type: String })
  iaoId?: string;

  @Prop({ type: ApprovedBy })
  firstReviewer: ApprovedBy;

  @Prop({ type: ApprovedBy })
  secondReviewer: ApprovedBy;
}

export const IAORequestSchema = SchemaFactory.createForClass(IAORequest);
