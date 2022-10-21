import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type ClaimDocument = Claim & Document;

export enum CLAIM_STATUS {
  SUCCESS = 1,
  FAILD = 2,
}

export enum CLAIM_TYPE {
  FNFT = 1,
  REFUND = 2,
}

@Schema({
  timestamps: true,
  collection: 'Claim',
})
export class Claim {
  @Prop({ type: Number })
  amount: number;

  @Prop({ type: String })
  buyerAddress: string;

  @Prop({ type: String })
  iaoEventId: string;

  @Prop({ type: Number, default: CLAIM_STATUS.SUCCESS })
  status?: number;

  @Prop({ type: Number })
  type?: number;
}

export const ClaimSchema = SchemaFactory.createForClass(Claim);
