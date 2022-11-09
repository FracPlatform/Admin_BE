import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type NotificationDocument = Notification & Document;

export enum NOTIFICATION_TYPE {
  ANNOUNCEMENT = 1,
  WHITELIST = 2,
  IAO_RESULTS = 3,
  EXCHANGE_ORDERS = 4,
}

@Schema({ collection: 'Notification', timestamps: true })
export class Notification {
  @Prop({ type: Number })
  type: NOTIFICATION_TYPE;

  @Prop({ type: String })
  receiver: string;

  @Prop({ type: String })
  title: string;

  @Prop({ type: String })
  content: string;

  @Prop({ type: String })
  notiQueueId?: string;

  @Prop({ type: Boolean, default: false })
  read: boolean;

  @Prop({ type: Date })
  createdAt?: Date;

  @Prop({ type: Date })
  updatedAt?: Date;
}
export const NotificationSchema = SchemaFactory.createForClass(Notification);
NotificationSchema.index({ receiver: 1 });
