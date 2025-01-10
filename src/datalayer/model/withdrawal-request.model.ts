import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { PURCHASE_TYPE } from './purchase.model';

export type WithdrawalRequestDocument = WithdrawalRequest & Document;

export enum WITHDRAWAL_REQUEST_STATUS {
  CANCELED = 0,
  REQUESTING = 1,
  PROCESSING = 2,
  SUCCESSFUL = 3,
  FAILED = 4,
  PROCESSING_EXCHANGE = 5, // call API withdrawl to dex successfully
  IN_REVIEW = 6,
}

export class WithdrawalRequestRevenue {
  balance: number;
  currencyContract: string;
  acceptedCurrencyUsdPrice?: number;
  acceptedCurrencySymbol: string;
  acceptedCurrencyLogo?: string;
  fnftContractAddress: string;
  exchangeRate: number;
  iaoEventId: string;
  transactionCompletedOn?: Date;
  txHash?: string;
}

export enum REVENUE_SOURCE {
  IAO = 1,
  EXCHANGE = 2,
}

@Schema({
  collection: 'WithdrawalRequest',
  timestamps: true,
})
export class WithdrawalRequest {
  @Prop({ type: String })
  createdBy: string;

  @Prop({ type: String })
  recipientAddress: string;

  @Prop({ type: () => [WithdrawalRequestRevenue] })
  revenue: WithdrawalRequestRevenue[];

  @Prop({ type: String })
  requestId: string;

  @Prop({ type: String })
  requestType: PURCHASE_TYPE;

  @Prop({ type: String })
  recipientBankName?: string;

  @Prop({ type: String })
  recipientAccountNumber?: string;

  @Prop({ type: String })
  recipientAccountHolder?: string;

  @Prop({ type: String })
  proofUrl?: string;

  @Prop({ type: Number })
  status: WITHDRAWAL_REQUEST_STATUS;

  @Prop({ type: Date, required: false })
  confirmedOn: Date;

  @Prop({ type: Date })
  requestedOn: Date;

  @Prop({ type: Number })
  revenueSource: REVENUE_SOURCE;

  @Prop({ type: String, required: false })
  exchangeRequestId?: string;

  @Prop({ type: Date, required: false })
  transactionCompletedOn?: Date;

  @Prop({ type: String, required: false })
  txHash?: string;

  @Prop({ type: String })
  reviewComment: string;

  @Prop({ type: String })
  reviewedBy: string;

  @Prop({ type: Date })
  reviewedOn: Date;

  @Prop({ type: Date })
  fractorCanceledOn: Date;
}
export const WithdrawalRequestSchema =
  SchemaFactory.createForClass(WithdrawalRequest);
WithdrawalRequestSchema.index({ requestId: 1 });
