import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type PurchaseDocument = Purchase & Document;

export enum PURCHASE_STATUS {
  PROCESS = 1,
  SUCCESS = 2,
  FAILD = 3,
}

@Schema({
  timestamps: true,
  collection: 'Purchase',
})
export class Purchase {
  @Prop({ type: Number })
  tokenAmount: number;

  @Prop({ type: Number })
  funds: number;

  @Prop({ type: String })
  buyerAddress: string;

  @Prop({ type: String })
  iaoEventId: string;

  @Prop({ type: Number, default: PURCHASE_STATUS.PROCESS })
  status?: number;

  @Prop({ type: String })
  transactionHash?: string;
}

export const PurchaseSchema = SchemaFactory.createForClass(Purchase);
