export class NotificationDraftEntity {
  notiQueueId: string;
  type: number;
  status: number;
  sendTo?: Array<number>;
  title: object;
  description?: object;
  updatedBy: string;
  createdBy: string;
}

export class NotifcationDetailEntity {
  notiQueueId: string;
  type: number;
  status: number;
  sendTo?: Array<number>;
  title: object;
  description?: object;
  updatedByAdmin: string;
  updatedBy: string;
  updatedAt: Date;
  createdByAdmin: string;
  createdBy: string;
  createdAt: Date;
  scheduledByAdmin?: string;
  scheduledBy?: string;
  scheduledOn?: Date;
  deactivatedByAdmin?: string;
  deactivatedBy?: string;
  deactivatedOn?: Date;
  sentOn?: Date;
}
