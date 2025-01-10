import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { DepositedNFT, DepositedNFTSchema } from '.';

export type NFTWithdrawalRequestDocument = NFTWithdrawalRequest & Document;

export enum NFT_WITHDRAWAL_REQUEST_STATUS {
  REQUESTING = 1,
  PROCESSING = 2,
  COMPLETED = 3,
  FAILED = 4,
  CANCELED = 5,
  PROCESSING_BLOCKCHAIN = 6,
}

@Schema({ collection: 'NFTWithdrawalRequest', timestamps: true })
export class NFTWithdrawalRequest {
  @Prop({ type: String })
  requestId: string;

  @Prop({ type: Number, default: NFT_WITHDRAWAL_REQUEST_STATUS.REQUESTING })
  status: NFT_WITHDRAWAL_REQUEST_STATUS;

  @Prop({ type: String })
  fractorId: string;

  @Prop({ type: String })
  recipientWalletAddress: string;

  @Prop({ type: String })
  contactEmail: string;

  @Prop({ type: Boolean, default: false })
  isEmailConfirmed: boolean;

  @Prop({ type: String })
  itemId?: string;

  @Prop({ type: [DepositedNFTSchema] })
  depositedNFTs: DepositedNFT[];

  @Prop({ type: Date })
  requestedOn: Date;

  @Prop({ type: Date })
  confirmedOn?: Date;

  @Prop({ type: String })
  transactionIdHash?: string;
}
export const NFTWithdrawalRequestSchema =
  SchemaFactory.createForClass(NFTWithdrawalRequest);
NFTWithdrawalRequestSchema.index({ requestId: 1 });
