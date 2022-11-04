export class NotificationDraftEntity {
  notiQueueId: string;
  type: number;
  status: number;
  localization: string;
  sendTo?: Array<number>;
  title: string;
  description?: any;
  updatedBy: string;
  createdBy: string;
}

export class NotifcationDetailEntity {
  notiQueueId: string;
  type: number;
  status: number;
  localization: string;
  sendTo?: Array<number>;
  title: string;
  description?: string;
  updatedByAdmin: string;
  updatedBy: string;
  updatedAt: Date;
  createdByAdmin: string;
  createdBy: string;
  createdAt: Date;
  scheduledByAdmin?: string;
  scheduledBy?: string;
  scheduledOn?: Date;
  sentOn?: Date;
}
