import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { TieringPoolStatus } from 'src/common/constants';

export type TieringPoolDocument = TieringPool & Document;

@Schema({
  timestamps: true,
  collection: 'TieringPool',
  versionKey: false,
})
export class TieringPool {
  @Prop({ type: Number })
  tieringPoolId?: number;

  @Prop({ type: String })
  poolContractAddress: string;

  @Prop({ type: String })
  tieringTokenAddress: string;

  @Prop({ type: Number })
  tieringTokenDecimal: number;

  @Prop({ type: String })
  tieringTokenSymbol: string;

  @Prop({ type: Number })
  lockDuration: number;

  @Prop({ type: Number })
  withdrawDelayDuration: number;

  @Prop({
    type: Number,
    enum: TieringPoolStatus,
    default: TieringPoolStatus.ON,
  })
  tieringPoolStatus?: number;
}

export const TieringPoolSchema = SchemaFactory.createForClass(TieringPool);
