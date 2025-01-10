import {
  Language,
  NotificationExtraData,
  NOTIFICATION_SUBTYPE,
  NOTIFICATION_TYPE,
} from 'src/datalayer/model';

export class NotificationEntity {
  type: NOTIFICATION_TYPE;
  receiver: string;
  title?: Language;
  content?: Language;
  notiQueueId?: string;
  read: boolean;
  subtype: NOTIFICATION_SUBTYPE;
  extraData: NotificationExtraData;
  deleted: boolean;
  hided: boolean;
  dexId: string;
}

export class NotificationForDexEntity {
  walletAddress?: string;
  uuid: string;
  type: NOTIFICATION_SUBTYPE;
  data: object;
}
