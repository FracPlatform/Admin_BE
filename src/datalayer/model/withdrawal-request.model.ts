import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type WithdrawalRequestDocument = WithdrawalRequest & Document;

export enum WITHDRAWAL_REQUEST_STATUS {
  CANCELED = 0,
  REQUESTING = 1,
  PROCESSING = 2,
  SUCCESSFUL = 3,
  FAILED = 4,
}

export class WithdrawalRequestRevenue {
  balance: number;
  currencyContract: string;
  acceptedCurrencySymbol: string;
  fnftContractAddress: string;
  exchangeRate: number;
  iaoEventId: string;
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

  @Prop({ type: Number })
  status: WITHDRAWAL_REQUEST_STATUS;

  @Prop({ type: Date, required: false })
  confirmedOn: Date;

  @Prop({ type: Date })
  requestedOn: Date;
}
export const WithdrawalRequestSchema =
  SchemaFactory.createForClass(WithdrawalRequest);
WithdrawalRequestSchema.index({ requestId: 1 });
