import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type EmailSubscriberDocument = EmailSubscriber & Document;

@Schema({
  timestamps: true,
  collection: 'EmailSubscriber',
  versionKey: false,
})
export class EmailSubscriber {
  @Prop({ type: String })
  email: string;

  @Prop({ type: Boolean, default: true })
  isSubscribed: boolean;
}

export const EmailSubscriberSchema =
  SchemaFactory.createForClass(EmailSubscriber);
EmailSubscriberSchema.index({ email: 1 }, { unique: true });
