import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type UserWithdrawalDocument = UserWithdrawal & Document;

export enum AFFILIATE_WITHDRAWAL_REQUEST_STATUS {
  CANCELED = 0,
  IN_REVIEW = 2,
  PROCESSING = 3,
  SUCCESSFUL = 4,
  FAILED = 5,
  PROCESSING_EXCHANGE = 6,
}

export class AffiliateWithdrawalRequestRevenue {
  balance: number;
  contractAddress: string;
  tokenLogo?: string;
  tokenSymbol: string;
  tokenDecimal: number;
  affiliateIds: Array<number>;
  transactionCompletedOn?: Date;
  txHash?: string;
}

@Schema({
  collection: 'UserWithdrawal',
  timestamps: true,
})
export class UserWithdrawal {
  @Prop({ type: String })
  createdBy: string;

  @Prop({ type: String })
  recipientAddress: string;

  @Prop({ type: String })
  emailReveiceNotification: string;

  @Prop({ type: () => [AffiliateWithdrawalRequestRevenue] })
  revenue: AffiliateWithdrawalRequestRevenue[];

  @Prop({ type: String })
  requestId: string;

  @Prop({ type: Number })
  status: AFFILIATE_WITHDRAWAL_REQUEST_STATUS;

  @Prop({ type: Date, required: false })
  transactionCompletedOn?: Date;

  @Prop({ type: String, required: false })
  txHash?: string;

  @Prop({ type: String })
  reviewComment?: string;

  @Prop({ type: String })
  reviewedBy?: string;

  @Prop({ type: Date })
  reviewedOn?: Date;

  @Prop({ type: Date })
  traderCanceledOn?: Date;
}
export const UserWithdrawalSchema =
  SchemaFactory.createForClass(UserWithdrawal);
UserWithdrawalSchema.index({ recipientAddress: 1 });
UserWithdrawalSchema.index(
  { requestId: 1 },
  {
    unique: true,
  },
);
