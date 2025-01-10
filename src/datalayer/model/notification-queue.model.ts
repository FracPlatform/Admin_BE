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

export enum SENT_TO {
  FRACTORS = 1,
  TRADERS = 2,
}

export class Language {
  en?: string;
  ja?: string;
  cn?: string;
  vi?: string;
}

@Schema({ collection: 'NotificationQueue', timestamps: true })
export class NotificationQueue {
  @Prop({ type: String })
  notiQueueId: string;

  @Prop({ type: Number, default: NOTIFICATION_QUEUE_TYPE.ANNOUNCEMENT })
  type: NOTIFICATION_QUEUE_TYPE;

  @Prop({ type: Number, default: NOTIFICATION_QUEUE_STATUS.DRAFT })
  status: NOTIFICATION_QUEUE_STATUS;

  @Prop({ type: Array, default: [SENT_TO.FRACTORS, SENT_TO.TRADERS] })
  sendTo?: SENT_TO[];

  @Prop({ type: Object })
  title: Language;

  @Prop({ type: Object })
  description?: Language;

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

  @Prop({ type: String })
  deactivatedBy?: string;

  @Prop({ type: Date })
  deactivatedOn?: Date;

  @Prop({ type: Boolean, default: false })
  sent?: boolean;
}
export const NotificationQueueSchema =
  SchemaFactory.createForClass(NotificationQueue);
NotificationQueueSchema.index({ notiQueueId: 1 });
