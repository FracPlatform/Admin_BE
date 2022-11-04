import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type NotificationQueueDocument = NotificationQueue & Document;

export enum NOTIFICATION_QUEUE_TYPE {
  ANNOUNCEMENT = 1,
}

export enum NOTIFICATION_QUEUE_STATUS {
  DRAFT = 1,
  SCHEDULED = 2,
  SENT = 3,
  INACTIVE = 4,
}

export enum LOCALIZATION {
  ENGLISH = 'en',
  CHINESE = 'cn',
  JAPANESE = 'ja',
}

export enum SENT_TO {
  FRACTORS = 1,
  TRADERS = 2,
}

@Schema({ collection: 'NotificationQueue', timestamps: true })
export class NotificationQueue {
  @Prop({ type: String })
  notiQueueId: string;

  @Prop({ type: Number, default: NOTIFICATION_QUEUE_TYPE.ANNOUNCEMENT })
  type: NOTIFICATION_QUEUE_TYPE;

  @Prop({ type: Number, default: NOTIFICATION_QUEUE_STATUS.DRAFT })
  status: NOTIFICATION_QUEUE_STATUS;

  @Prop({ type: String, default: LOCALIZATION.ENGLISH })
  localization: string;

  @Prop({ type: Array, default: [SENT_TO.FRACTORS, SENT_TO.TRADERS] })
  sendTo?: SENT_TO[];

  @Prop({ type: String })
  title: string;

  @Prop({ type: String })
  description?: string;

  @Prop({ type: String })
  updatedBy: string;

  @Prop({ type: String })
  createdBy: string;

  @Prop({ type: String })
  scheduledBy?: string;

  @Prop({ type: Date })
  scheduledOn?: Date;

  @Prop({ type: Date, default: null })
  sentOn?: Date;

  @Prop({ type: Date })
  createdAt?: Date;

  @Prop({ type: Date })
  updatedAt?: Date;
}
export const NotificationQueueSchema =
  SchemaFactory.createForClass(NotificationQueue);
NotificationQueueSchema.index({ notiQueueId: 1 });
