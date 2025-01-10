import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { STAKING_TYPE } from 'src/common/constants';

export type StakingHistoryDocument = StakingHistory & Document;
@Schema({
  timestamps: true,
  collection: 'StakingHistory',
  versionKey: false,
})
export class StakingHistory {
  @Prop({ type: String })
  walletAddress: string;

  @Prop({ type: 'string' })
  value: string;

  @Prop({
    enum: STAKING_TYPE,
  })
  type: number;

  @Prop({ type: 'string' })
  balance: string;

  @Prop({ type: 'string' })
  transactionHash: string;
}
export const StakingHistorySchema =
  SchemaFactory.createForClass(StakingHistory);
StakingHistorySchema.index({ walletAddress: 'text' });
