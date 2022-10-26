import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Phone } from '.';

export type RedemptionRequestDocument = RedemptionRequest & Document;

export enum REDEMPTION_REQUEST_STATUS {
  CANCEL = 0,
  IN_REVIEW = 1,
  PROCESSING = 2,
  REDEEMED = 3,
  REJECTED = 4,
}

@Schema({ collection: 'RedemptionRequest', timestamps: true })
export class RedemptionRequest {
  @Prop({ type: String })
  requestId: string;

  @Prop({ type: Number, default: REDEMPTION_REQUEST_STATUS.IN_REVIEW })
  status: REDEMPTION_REQUEST_STATUS;

  @Prop({ type: [String] })
  items: string[];

  @Prop({ type: String })
  recipientName: string;

  @Prop({ type: String })
  contactEmail: string;

  @Prop({ type: String })
  receiptAddress: string;

  @Prop({ type: Phone })
  contactPhone: Phone;

  @Prop({ type: String })
  note: string;

  @Prop({ type: String })
  createdBy: string;

  @Prop({ type: String })
  reviewComment: string;

  @Prop({ type: String })
  reviewedBy: string;
}
export const RedemptionRequestSchema =
  SchemaFactory.createForClass(RedemptionRequest);
RedemptionRequestSchema.index({ requestId: 1 });
