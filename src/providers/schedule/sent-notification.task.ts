import { Notification } from './../../datalayer/model/notification.model';
import {
  NotificationQueue,
  NOTIFICATION_QUEUE_STATUS,
  SENT_TO,
} from './../../datalayer/model/notification-queue.model';
import { IDataServices } from 'src/core/abstracts/data-services.abstract';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Fractor, User, USER_STATUS } from 'src/datalayer/model';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { MailService } from 'src/services/mail/mail.service';

@Injectable()
export class SentNotificationTask {
  private readonly logger = new Logger(SentNotificationTask.name);
  constructor(
    private readonly dataService: IDataServices,
    private readonly mailService: MailService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    this.logger.warn('Start Job Send Notification');

    const notifications = await this.dataService.notificationQueue.findMany({
      status: NOTIFICATION_QUEUE_STATUS.SCHEDULED,
      sentOn: { $lte: new Date() },
    });
    if (notifications.length === 0) {
      this.logger.warn('End job send notification');
      return;
    }

    const traders = await this.dataService.user.findMany({
      status: USER_STATUS.ACTIVE,
      'notificationSettings.announcements': true,
    });

    const fractors = await this.dataService.fractor.findMany({
      isBlocked: false,
    });

    const idFractors = fractors.map((fractor) => fractor.fractorId);
    const idTraders = traders.map((trader) => trader.userId);

    for (let i = 0; i < notifications.length; i++) {
      this.logger.log(
        `Handle send notification for ${notifications[i].notiQueueId}`,
      );
      const session = await this.connection.startSession();
      await session.withTransaction(async () => {
        if (
          notifications[i].sendTo?.includes(SENT_TO.FRACTORS) &&
          idFractors.length
        ) {
          await this.sendNotification(idFractors, notifications[i], session);
        }
        if (
          notifications[i].sendTo?.includes(SENT_TO.TRADERS) &&
          idTraders.length
        ) {
          await this.sendNotification(idTraders, notifications[i], session);
        }

        await this.dataService.notificationQueue.updateOne(
          { notiQueueId: notifications[i].notiQueueId },
          { status: NOTIFICATION_QUEUE_STATUS.SENT },
          { session: session },
        );
      });
      this.logger.log('Handle send mail', new Date());

      const mailFractor = this.getMailFractor(fractors);
      const mailTrader = this.getMailTrader(traders);
      const mailAll = [...mailTrader, ...mailFractor];
      if (
        notifications[i].sendTo?.includes(SENT_TO.FRACTORS) &&
        notifications[i].sendTo?.includes(SENT_TO.TRADERS) &&
        mailAll.length
      ) {
        await this.mailService.sendNotification(
          mailAll,
          notifications[i].description,
        );
      } else if (
        notifications[i].sendTo?.includes(SENT_TO.FRACTORS) &&
        mailFractor.length
      ) {
        await this.mailService.sendNotification(
          mailFractor,
          notifications[i].description,
        );
      } else if (
        notifications[i].sendTo?.includes(SENT_TO.TRADERS) &&
        mailTrader.length
      ) {
        await this.mailService.sendNotification(
          mailTrader,
          notifications[i].description,
        );
      }
      this.logger.log('End send mail', new Date());
      session.endSession();
    }
    this.logger.warn('End job send notification');
  }

  async sendNotification(
    receivers: string[],
    notiQueue: NotificationQueue,
    session,
  ) {
    const data = receivers.map((receiver) => this.addData(receiver, notiQueue));
    await this.dataService.notification.insertMany(data, {
      session: session,
    });
  }

  private addData(receiver: string, notiQueue: NotificationQueue) {
    return {
      type: notiQueue.type as any,
      receiver: receiver,
      notiQueueId: notiQueue.notiQueueId,
      title: notiQueue.title,
      content: notiQueue.description,
      read: false,
    } as Notification;
  }

  private getMailFractor(fractors: Fractor[]): string[] {
    const frac = fractors.map((frac) => (frac.verified ? frac.email : null));
    return frac.filter((f) => f != null);
  }

  private getMailTrader(traders: User[]): string[] {
    const trader = traders.map((user) =>
      user.isEmailConfirmed ? user.email : null,
    );
    return trader.filter((u) => u != null);
  }
}
