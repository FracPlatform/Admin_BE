import { CreateNotifQueueDto } from './dto/notification-queue.dto';
import { Injectable } from '@nestjs/common';
import { IDataServices } from 'src/core/abstracts/data-services.abstract';
import { Utils } from 'src/common/utils';
import { PREFIX_ID } from 'src/common/constants';
import { NotifcationDetailEntity, NotificationDraftEntity } from 'src/entity';
import {
  NotificationQueue,
  NOTIFICATION_QUEUE_STATUS,
} from 'src/datalayer/model';

@Injectable()
export class NotificationQueueBuilderService {
  constructor(private readonly dataService: IDataServices) {}

  async createNotiDraft(data: CreateNotifQueueDto, admin: any, session) {
    const prefixId = await Utils.getNextPrefixId(
      this.dataService.counterId,
      PREFIX_ID.NOTIFICATION,
      session,
    );
    const response: NotificationDraftEntity = {
      notiQueueId: prefixId,
      type: data.type,
      status: NOTIFICATION_QUEUE_STATUS.DRAFT,
      sendTo: data.sendTo,
      title: data.title,
      description: data.description,
      updatedBy: admin.adminId,
      createdBy: admin.adminId,
    };
    return response;
  }

  getDetailNotifQueue(notification: NotificationQueue, data: any) {
    const response: NotifcationDetailEntity = {
      notiQueueId: notification.notiQueueId,
      type: notification.type,
      status: notification.status,
      sendTo: notification.sendTo,
      title: notification.title,
      description: notification.description,
      createdByAdmin: data.createdByAdmin,
      createdBy: notification.createdBy,
      createdAt: notification.createdAt,
      updatedByAdmin: data.updatedByAdmin,
      updatedBy: notification.updatedBy,
      updatedAt: new Date(),
      scheduledByAdmin: data.scheduledByAdmin,
      scheduledBy: notification.scheduledBy,
      scheduledOn: notification.scheduledOn,
      sentOn: notification.sentOn,
      deactivatedByAdmin: data.deactivatedByAdmin,
      deactivatedBy: notification.deactivatedBy,
      deactivatedOn: notification.deactivatedOn,
    };
    return response;
  }
}
