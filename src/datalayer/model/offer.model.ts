import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
export type OfferDocument = Offer & Document;

export enum OFFER_STATUS {
  WATTING = 1,
  ACCEPT = 2,
  REJECT = 3,
}
@Schema({
  timestamps: true,
  collection: 'Offer',
})
export class Offer {
  @Prop({ type: String })
  senderAddress: string;

  @Prop({ type: String })
  receiverAddress: string;

  @Prop({ type: Number })
  commissionRate: number;

  @Prop({ type: Number, default: OFFER_STATUS.WATTING })
  status?: number;

  @Prop({ type: String })
  receiverEmail?: string;

  @Prop({ type: Date, default: null })
  becameAffiliate?: Date;

  @Prop({ type: Date })
  joinOn?: Date;
}

export const OfferSchema = SchemaFactory.createForClass(Offer);
OfferSchema.index({ receiverAddress: 1 });
OfferSchema.index({ receiverEmail: 1 });
