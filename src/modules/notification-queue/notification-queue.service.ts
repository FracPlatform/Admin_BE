import {
  CreateNotifQueueDto,
  ScheduleNotificationDto,
  UpdateNotifQueueDto,
} from './dto/notification-queue.dto';
import { Injectable, Logger } from '@nestjs/common';
import { ErrorCode } from 'src/common/constants';
import { IDataServices } from 'src/core/abstracts/data-services.abstract';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { ApiError } from 'src/common/api';
import { NotificationQueueBuilderService } from './notification-queue.factory.service';
import {
  NotificationQueue,
  NOTIFICATION_QUEUE_STATUS,
} from 'src/datalayer/model';

@Injectable()
export class NotificationQueueService {
  private readonly logger = new Logger(NotificationQueueService.name);

  constructor(
    private readonly dataService: IDataServices,
    private readonly notifQueueBuilderService: NotificationQueueBuilderService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async getNotifications() {
    return '';
  }

  async getDetail(notiQueueId: string) {
    const notiQueue = await this.dataService.notificationQueue.findOne({
      notiQueueId: notiQueueId,
    });
    this._checkNotiExists(notiQueue);
    const admins = await this.dataService.admin.findMany({
      adminId: {
        $in: [notiQueue.createdBy, notiQueue.updatedBy, notiQueue.scheduledBy],
      },
    });
    const createdAdmin = admins.find(
      (admin) => admin.adminId === notiQueue.createdBy,
    );
    const updateByAdmin = admins.find(
      (admin) => admin.adminId === notiQueue.updatedBy,
    );
    const scheduledByAdmin = admins.find(
      (admin) => admin.adminId === notiQueue.scheduledBy,
    );
    const data = {
      createdByAdmin: createdAdmin?.fullname,
      updatedByAdmin: updateByAdmin?.fullname,
      scheduledByAdmin: scheduledByAdmin?.fullname,
    };

    return this.notifQueueBuilderService.getDetailNotifQueue(notiQueue, data);
  }

  async createDraft(user: any, data: CreateNotifQueueDto) {
    let result;
    const session = await this.connection.startSession();
    await session.withTransaction(async () => {
      const notiQueue = await this.notifQueueBuilderService.createNotiDraft(
        data,
        user,
        session,
      );
      result = await this.dataService.notificationQueue.create(notiQueue, {
        session: session,
      });
    });
    session.endSession();
    return result;
  }

  async updateNotification(
    notiQueueId: string,
    data: UpdateNotifQueueDto,
    admin: any,
  ) {
    const notification = await this.dataService.notificationQueue.findOne({
      notiQueueId: notiQueueId,
    });
    this._checkNotiExists(notification);
    if (notification.status !== NOTIFICATION_QUEUE_STATUS.DRAFT) {
      throw ApiError('', 'Only Draft notifications can be update');
    }
    const updateNotification =
      await this.dataService.notificationQueue.updateOne(
        { notiQueueId: notiQueueId },
        {
          updatedBy: admin.adminId,
          ...data,
        },
      );

    this._checkUpdateNoti(updateNotification);
    return notiQueueId;
  }

  async scheduleNotification(
    notiQueueId: string,
    data: ScheduleNotificationDto,
    admin: any,
  ) {
    if (new Date(data.sentOn) < new Date()) {
      throw ApiError(
        '',
        'Select time to sent notification must be later than current time',
      );
    }

    const notification = await this.dataService.notificationQueue.findOne({
      notiQueueId: notiQueueId,
    });
    this._checkNotiExists(notification);
    if (notification.status !== NOTIFICATION_QUEUE_STATUS.DRAFT) {
      throw ApiError('', 'Only draft notifications can be scheduled');
    }
    const updateNotification =
      await this.dataService.notificationQueue.updateOne(
        {
          notiQueueId: notiQueueId,
        },
        {
          status: NOTIFICATION_QUEUE_STATUS.SCHEDULED,
          updatedBy: admin.adminId,
          scheduledOn: new Date(),
          sentOn: data.sentOn,
          scheduledBy: admin.adminId,
        },
      );
    this._checkUpdateNoti(updateNotification);

    return notiQueueId;
  }

  async cancelScheduleNotification(notiQueueId: string, admin: any) {
    const notification = await this.dataService.notificationQueue.findOne({
      notiQueueId: notiQueueId,
    });
    this._checkNotiExists(notification);
    if (notification.status !== NOTIFICATION_QUEUE_STATUS.SCHEDULED) {
      throw ApiError('', 'Only Scheduled notifications can be cancel schedule');
    }
    const updateNotification =
      await this.dataService.notificationQueue.updateOne(
        { notiQueueId: notiQueueId },
        {
          $unset: { scheduledOn: 1, scheduledBy: 1, sentOn: 1 },
          status: NOTIFICATION_QUEUE_STATUS.DRAFT,
          updatedBy: admin.adminId,
        },
      );
    this._checkUpdateNoti(updateNotification);
    return notiQueueId;
  }

  async deactivateNotification(notiQueueId: string, admin: any) {
    const notification = await this.dataService.notificationQueue.findOne({
      notiQueueId: notiQueueId,
    });
    this._checkNotiExists(notification);
    if (notification.status !== NOTIFICATION_QUEUE_STATUS.SENT) {
      throw ApiError('', 'Only deactivate notifications has status SENT');
    }
    await this.dataService.notificationQueue.updateOne(
      {
        notiQueueId: notiQueueId,
      },
      { status: NOTIFICATION_QUEUE_STATUS.INACTIVE, updatedBy: admin.adminId },
    );
    return notiQueueId;
  }

  private _checkNotiExists(notification: NotificationQueue) {
    if (!notification) {
      throw ApiError('', 'Notification not found');
    }
  }

  private _checkUpdateNoti(updateNoti) {
    if (updateNoti.modifiedCount === 0) {
      throw ApiError('', 'Schedule notification failed');
    }
  }
}
