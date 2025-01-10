import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import { get } from 'lodash';
import { EMAIL_CONFIG } from 'src/common/email-config';
import { ClientSession, Connection } from 'mongoose';
import { IDataServices } from 'src/core/abstracts/data-services.abstract';
import {
  ADMIN_STATUS,
  Fractor,
  User,
  USER_STATUS,
  VAULT_TYPE,
} from 'src/datalayer/model';
import {
  NotificationEntity,
  NotificationForDexEntity,
} from 'src/entity/notification.entity';
import { EmailService, Mail } from 'src/services/email/email.service';
import { MailService } from 'src/services/mail/mail.service';
import {
  SOCKET_NAMESPACE,
  SOCKET_NOTIFICATION_EVENT,
} from '../socket/socket.enum';
import { SocketGateway } from '../socket/socket.gateway';
import {
  NotificationQueue,
  NOTIFICATION_QUEUE_STATUS,
  SENT_TO,
} from './../../datalayer/model/notification-queue.model';
import {
  Notification,
  NotificationExtraData,
  NOTIFICATION_SUBTYPE,
  NOTIFICATION_TYPE,
} from './../../datalayer/model/notification.model';
import { HttpService } from '@nestjs/axios';
import { Role } from 'src/modules/auth/role.enum';
@Injectable()
export class SentNotificationTask {
  private readonly logger = new Logger(SentNotificationTask.name);
  constructor(
    private readonly dataService: IDataServices,
    private readonly mailService: MailService,
    private readonly emailService: EmailService,
    private readonly socketGateway: SocketGateway,
    private readonly http: HttpService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  @Cron('0 */1 * * * *')
  async handleCron() {
    try {
      const notifications = await this.dataService.notificationQueue.findMany({
        status: NOTIFICATION_QUEUE_STATUS.SCHEDULED,
        sentOn: { $lte: new Date() },
        sent: false,
      });
      if (notifications.length === 0) {
        return;
      }

      const [traders, fractors] = await Promise.all([
        this.dataService.user.findMany({
          status: USER_STATUS.ACTIVE,
          'notificationSettings.announcements': true,
        }),
        this.dataService.fractor.findMany({
          isBlocked: false,
          'notificationSettings.announcements': true,
        }),
      ]);

      const idFractors = fractors.map((fractor) => fractor.fractorId);
      const idTraders = traders.map((trader) => trader.userId);
      let notificationTraders = [];

      for (let i = 0; i < notifications.length; i++) {
        this.logger.log(
          `Handle send notification for ${notifications[i].notiQueueId}`,
        );
        const session = await this.connection.startSession();
        await session.withTransaction(async () => {
          await this.dataService.notificationQueue.updateOne(
            { notiQueueId: notifications[i].notiQueueId },
            { sent: true },
            { session },
          );
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
            notificationTraders = await this.sendNotification(
              idTraders,
              notifications[i],
              session,
            );
          }

          await this.dataService.notificationQueue.updateOne(
            { notiQueueId: notifications[i].notiQueueId },
            { status: NOTIFICATION_QUEUE_STATUS.SENT },
            { session: session },
          );
        });
        session.endSession();

        // push notifications for DEX
        if (notificationTraders.length)
          await this.sendNotificationSystemForDex(notifications[i]);

        this.logger.log('Handle send mail', new Date());

        const mailFractor = this.getMailFractor(fractors);
        const mailTrader = this.getMailTrader(traders);
        const mailAll = [...mailTrader, ...mailFractor];
        const dataSocket = {
          title: notifications[i].title,
          content: notifications[i].description,
          type: NOTIFICATION_TYPE.ANNOUNCEMENT,
        };
        if (
          notifications[i].sendTo?.includes(SENT_TO.FRACTORS) &&
          notifications[i].sendTo?.includes(SENT_TO.TRADERS) &&
          mailAll.length
        ) {
          await this.sendMailNotification(mailAll, notifications[i].title.en, {
            description: notifications[i].description.en,
          });
          this.socketGateway.sendNotification(
            SOCKET_NAMESPACE.ANNOUNCEMENT,
            SOCKET_NOTIFICATION_EVENT.FRACTORS_ANNOUNCEMENT_EVENT,
            dataSocket,
          );
          this.socketGateway.sendNotification(
            SOCKET_NAMESPACE.ANNOUNCEMENT,
            SOCKET_NOTIFICATION_EVENT.TRADERS_ANNOUNCEMENT_EVENT,
            dataSocket,
          );
        } else if (
          notifications[i].sendTo?.includes(SENT_TO.FRACTORS) &&
          mailFractor.length
        ) {
          await this.sendMailNotification(
            mailFractor,
            notifications[i].title.en,
            {
              description: notifications[i].description.en,
            },
          );
          this.socketGateway.sendNotification(
            SOCKET_NAMESPACE.ANNOUNCEMENT,
            SOCKET_NOTIFICATION_EVENT.FRACTORS_ANNOUNCEMENT_EVENT,
            dataSocket,
          );
        } else if (
          notifications[i].sendTo?.includes(SENT_TO.TRADERS) &&
          mailTrader.length
        ) {
          await this.sendMailNotification(
            mailTrader,
            notifications[i].title.en,
            {
              description: notifications[i].description.en,
            },
          );
          this.socketGateway.sendNotification(
            SOCKET_NAMESPACE.ANNOUNCEMENT,
            SOCKET_NOTIFICATION_EVENT.TRADERS_ANNOUNCEMENT_EVENT,
            dataSocket,
          );
        }
        this.logger.log('End send mail', new Date());
      }
    } catch (err) {
      this.logger.error('handleCron');
      this.logger.error(err);
      this.logger.error(err?.stack);
    }
  }

  @Cron('10 */1 * * * *')
  async sendWhitelistAnnouncementNotification() {
    try {
      const iaoEventsToAnnounce: any[] =
        await this.dataService.iaoEvent.aggregate([
          {
            $match: {
              whitelistAnnouncementTime: {
                $lte: new Date(),
              },
              'notificationStatus.isWhitelistAnnounced': false,
            },
          },
          {
            $lookup: {
              from: 'Whitelist',
              localField: 'iaoEventId',
              foreignField: 'iaoEventId',
              as: 'whitelist',
            },
          },
          {
            $unwind: {
              path: '$whitelist',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $addFields: {
              isWhitelistEmpty: {
                $cond: {
                  if: {
                    $and: [
                      { $isArray: '$whitelist.whiteListAddresses' },
                      { $size: '$whitelist.whiteListAddresses' },
                    ],
                  },
                  then: false,
                  else: true,
                },
              },
            },
          },
          {
            $facet: {
              iaoEvents: [
                {
                  $project: {
                    iaoEventId: 1,
                    iaoEventName: 1,
                    whitelist: 1,
                    isWhitelistEmpty: 1,
                  },
                },
              ],
              addresses: [
                {
                  $unwind: {
                    path: '$whitelist.whiteListAddresses',
                    preserveNullAndEmptyArrays: true,
                  },
                },
                {
                  $lookup: {
                    from: 'User',
                    localField: 'whitelist.whiteListAddresses.walletAddress',
                    foreignField: 'walletAddress',
                    as: 'user',
                  },
                },
                {
                  $unwind: {
                    path: '$user',
                    preserveNullAndEmptyArrays: true,
                  },
                },
              ],
            },
          },
        ]);
      const iaoEvents: any[] = get(iaoEventsToAnnounce, [0, 'iaoEvents']);
      const addresses: any[] = get(iaoEventsToAnnounce, [0, 'addresses']);
      if (!iaoEvents.length) return;

      const iaoEventsNoWhitelist = iaoEvents.filter((a) => a.isWhitelistEmpty);
      const iaoEventsHasWhitelist = iaoEvents.filter(
        (a) => !a.isWhitelistEmpty,
      );

      // notification of Whitelist is Empty
      await this.createNotifications(iaoEventsNoWhitelist);

      // notification of Whitelist
      await this.createNotificationsForWhitelist(
        addresses,
        iaoEventsHasWhitelist,
        {
          keySetting: 'whitelists',
          subtype: 'WHITELISTS',
          statusNoti: 'isWhitelistAnnounced',
          linkConfigMail: 'WHITELIST_ANNOUNCEMENT',
          socketNamepcace: 'WHITELIST_ANNOUNCEMENT',
          socketEvent: 'WHITELIST_ANNOUNCEMENT_EVENT',
        },
      );
    } catch (err) {
      this.logger.error('sendWhitelistAnnouncementNotification');
      this.logger.error(err);
      this.logger.error(err?.stack);
    }
  }

  async createNotificationsForWhitelist(addresses, iaoEvents, dataConfig) {
    if (!iaoEvents.length) return;
    const newNotifications = [];
    const userObj = {};

    for (const address of addresses) {
      if (
        !address.isWhitelistEmpty &&
        address.user?.notificationSettings?.[dataConfig.keySetting]
      ) {
        newNotifications.push(
          this._createSystemNotification(
            address.user.userId,
            NOTIFICATION_SUBTYPE[dataConfig.subtype],
            {
              iaoEventId: address.iaoEventId,
              iaoEventName: address.iaoEventName,
            },
          ),
        );

        //add userObj
        if (!userObj[address.user.userId])
          userObj[address.user.userId] = address.user;
      }
    }

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      await this.dataService.iaoEvent.updateMany(
        {
          iaoEventId: {
            $in: iaoEvents.map((iaoEvent) => iaoEvent.iaoEventId),
          },
        },
        {
          $set: {
            [`notificationStatus.${dataConfig.statusNoti}`]: true,
          },
        },
        { session },
      );

      const insertedNotifications =
        await this.dataService.notification.insertMany(newNotifications, {
          session,
        });
      await session.commitTransaction();
      await this.sendNotificationForDex(insertedNotifications);

      const obj = {};
      for (const noti of insertedNotifications) {
        // add obj
        if (!obj[noti.extraData.iaoEventId])
          obj[noti.extraData.iaoEventId] = {
            iaoEventName: noti.extraData.iaoEventName,
            addresses: [],
            emails: {
              en: [],
              cn: [],
              ja: [],
              vi: [],
            },
          };

        const currentUser = userObj[noti.receiver];
        if (currentUser?.email) {
          obj[noti.extraData.iaoEventId].emails[currentUser.localization].push(
            currentUser.email,
          );
        }

        obj[noti.extraData.iaoEventId].addresses.push(
          currentUser.walletAddress,
        );
      }

      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          // socket
          this.socketGateway.sendNotification(
            SOCKET_NAMESPACE[dataConfig.socketNamepcace],
            SOCKET_NOTIFICATION_EVENT[dataConfig.socketEvent],
            key,
            obj[key].addresses,
            obj[key].iaoEventName,
          );

          // send mail
          for (const lang in obj[key].emails) {
            if (!obj[key].emails[lang].length) continue;

            // sendMailWhitelistToTrader
            const data = {
              bcc: obj[key].emails[lang],
              from: {
                name: EMAIL_CONFIG.FROM_EMAIL,
                address: process.env.MAIL_FROM,
              },
              subject: EMAIL_CONFIG.TITLE?.[dataConfig.linkConfigMail]?.[lang],
              template: `./${
                EMAIL_CONFIG.DIR?.[dataConfig.linkConfigMail]
              }-${lang}`,
              context: {
                eventName:
                  obj[key].iaoEventName[lang] || obj[key].iaoEventName['en'],
                eventDetailUrl: `${process.env.TRADER_DOMAIN}/${lang}/iao-event/${key}`,
              },
            };
            await this.emailService.addQueue(data);
          }
        }
      }
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async createNotifications(listIaoEvent) {
    const newNotifications = [];

    const listAdmin = await this.dataService.admin.findMany({
      role: {
        $in: [Role.SuperAdmin, Role.OperationAdmin, Role.OWNER],
      },
      status: ADMIN_STATUS.ACTIVE,
      deleted: false,
    });

    for (const iaoE of listIaoEvent) {
      listAdmin.forEach((a) => {
        newNotifications.push({
          type: NOTIFICATION_TYPE.ANNOUNCEMENT,
          receiver: a.adminId,
          subtype: NOTIFICATION_SUBTYPE.WHITELISTS,
          extraData: {
            eventName: iaoE.iaoEventName['en'],
            eventId: iaoE.iaoEventId,
          },
          read: false,
          deleted: false,
          hided: false,
          dexId: null,
        });
      });
    }

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      await this.dataService.iaoEvent.updateMany(
        {
          iaoEventId: {
            $in: listIaoEvent.map((iaoEvent) => iaoEvent.iaoEventId),
          },
        },
        {
          $set: {
            'notificationStatus.isWhitelistAnnounced': true,
          },
        },
        { session },
      );

      const listNewNotification =
        await this.dataService.notification.insertMany(newNotifications);

      await session.commitTransaction();

      const obj = {};
      for (const currentNoti of listNewNotification) {
        if (!obj[currentNoti.extraData.eventId])
          obj[currentNoti.extraData.eventId] = {
            eventName: currentNoti.extraData.eventName,
            subtype: currentNoti.subtype,
            adminIds: [],
          };
        obj[currentNoti.extraData.eventId].adminIds.push(currentNoti.receiver);
      }

      // socket
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          this.socketGateway.sendNotification(
            SOCKET_NAMESPACE.ADMIN_ANNOUNCEMENT,
            SOCKET_NOTIFICATION_EVENT.WHITELIST_ANNOUNCEMENT_EVENT,
            obj[key].adminIds,
            {
              eventId: key,
              eventName: obj[key].eventName,
              subtype: obj[key].subtype,
            },
          );
        }
      }

      //send Mail
      const listMail = listAdmin.filter((a) => a.email).map((a) => a.email);
      for (const iaoE of listIaoEvent) {
        // sendMailWhitelistIsEmptyToAdmin
        const data = {
          bcc: listMail,
          from: {
            name: EMAIL_CONFIG.FROM_EMAIL,
            address: process.env.MAIL_FROM,
          },
          subject: EMAIL_CONFIG.TITLE.WHITELIST_EMPTY,
          template: `./${EMAIL_CONFIG.DIR.WHITELIST_EMPTY}`,
          context: {
            eventName: iaoE.iaoEventName['en'],
            eventId: iaoE.iaoEventId,
          },
        };
        await this.emailService.addQueue(data);
      }
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  @Cron('20 */1 * * * *')
  async sendParticipationStartNotification() {
    try {
      const iaoEventToStart = await this.dataService.iaoEvent.aggregate([
        {
          $match: {
            participationStartTime: {
              $lte: new Date(),
            },
            participationEndTime: {
              $gte: new Date(),
            },
            'notificationStatus.isParticipationStartAnnounced': false,
          },
        },
        {
          $lookup: {
            from: 'Whitelist',
            localField: 'iaoEventId',
            foreignField: 'iaoEventId',
            as: 'whitelist',
          },
        },
        {
          $unwind: {
            path: '$whitelist',
          },
        },
        {
          $facet: {
            iaoEvents: [
              {
                $project: {
                  iaoEventId: 1,
                  iaoEventName: 1,
                  whitelist: 1,
                },
              },
            ],
            addresses: [
              {
                $unwind: {
                  path: '$whitelist.whiteListAddresses',
                },
              },
              {
                $lookup: {
                  from: 'User',
                  localField: 'whitelist.whiteListAddresses.walletAddress',
                  foreignField: 'walletAddress',
                  as: 'user',
                },
              },
              {
                $unwind: {
                  path: '$user',
                },
              },
            ],
          },
        },
      ]);
      const iaoEvents: any[] = get(iaoEventToStart, [0, 'iaoEvents']);
      const addresses: any[] = get(iaoEventToStart, [0, 'addresses']);
      if (!iaoEvents.length) return;

      // notification of Whitelist
      await this.createNotificationsForWhitelist(addresses, iaoEvents, {
        keySetting: 'iaoEvent',
        subtype: 'IAO_PARTICIPATION_START',
        statusNoti: 'isParticipationStartAnnounced',
        linkConfigMail: 'PARTICIPATION_TIME_START',
        socketNamepcace: 'IAO_EVENT_SCHEDULE',
        socketEvent: 'PARTICIPATION_TIME_START_EVENT',
      });
    } catch (err) {
      this.logger.error('sendParticipationStartNotification');
      this.logger.error(err);
      this.logger.error(err?.stack);
    }
  }

  @Cron('30 */1 * * * *')
  async sendIaoEventFailedNotification() {
    try {
      const iaoEventFailed = await this.dataService.iaoEvent.aggregate([
        {
          $match: {
            $and: [
              {
                participationEndTime: {
                  $lte: new Date(),
                },
                vaultType: VAULT_TYPE.VAULT,
                'notificationStatus.isIaoEventFailedAnnounced': false,
                'notificationStatus.isIaoEventSucceededAnnounced': false,
              },
              {
                $expr: {
                  $lt: [
                    { $subtract: ['$totalSupply', '$availableSupply'] },
                    {
                      $multiply: [
                        '$vaultUnlockThreshold',
                        '$totalSupply',
                        0.01,
                      ],
                    },
                  ],
                },
              },
            ],
          },
        },
        {
          $lookup: {
            from: 'Whitelist',
            localField: 'iaoEventId',
            foreignField: 'iaoEventId',
            as: 'whitelist',
          },
        },
        {
          $unwind: {
            path: '$whitelist',
          },
        },
        {
          $facet: {
            iaoEvents: [
              {
                $project: {
                  iaoEventId: 1,
                  iaoEventName: 1,
                  whitelist: 1,
                },
              },
            ],
            addresses: [
              {
                $unwind: {
                  path: '$whitelist.whiteListAddresses',
                },
              },
              {
                $lookup: {
                  from: 'User',
                  localField: 'whitelist.whiteListAddresses.walletAddress',
                  foreignField: 'walletAddress',
                  as: 'user',
                },
              },
              {
                $unwind: {
                  path: '$user',
                },
              },
            ],
          },
        },
      ]);
      const iaoEvents: any[] = get(iaoEventFailed, [0, 'iaoEvents']);
      const addresses: any[] = get(iaoEventFailed, [0, 'addresses']);
      if (!iaoEvents.length) return;

      // notification of Whitelist
      await this.createNotificationsForWhitelist(addresses, iaoEvents, {
        keySetting: 'iaoEvent',
        subtype: 'IAO_VAULT_FAILED',
        statusNoti: 'isIaoEventFailedAnnounced',
        linkConfigMail: 'IAO_EVENT_FAILED',
        socketNamepcace: 'IAO_EVENT_SCHEDULE',
        socketEvent: 'IAO_EVENT_FAILED_EVENT',
      });
    } catch (err) {
      this.logger.error('sendIaoEventFailedNotification');
      this.logger.error(err);
      this.logger.error(err?.stack);
    }
  }

  @Cron('40 */1 * * * *')
  async sendIaoEventSucceededNotification() {
    try {
      const iaoEventSucceeded = await this.dataService.iaoEvent.aggregate([
        {
          $match: {
            'notificationStatus.isIaoEventSucceededAnnounced': false,
            'notificationStatus.isIaoEventFailedAnnounced': false,

            $or: [
              {
                $and: [
                  {
                    participationEndTime: {
                      $lte: new Date(),
                    },
                  },
                  {
                    vaultType: VAULT_TYPE.NON_VAULT,
                  },
                ],
              },
              {
                $and: [
                  {
                    participationEndTime: {
                      $lte: new Date(),
                    },
                  },
                  {
                    vaultType: VAULT_TYPE.VAULT,
                  },
                  {
                    $expr: {
                      $gte: [
                        { $subtract: ['$totalSupply', '$availableSupply'] },
                        {
                          $multiply: [
                            '$vaultUnlockThreshold',
                            '$totalSupply',
                            0.01,
                          ],
                        },
                      ],
                    },
                  },
                ],
              },
            ],
          },
        },
        {
          $lookup: {
            from: 'Whitelist',
            localField: 'iaoEventId',
            foreignField: 'iaoEventId',
            as: 'whitelist',
          },
        },
        {
          $unwind: {
            path: '$whitelist',
          },
        },
        {
          $facet: {
            iaoEvents: [
              {
                $project: {
                  iaoEventId: 1,
                  iaoEventName: 1,
                  whitelist: 1,
                  vaultType: 1,
                },
              },
            ],
            addresses: [
              {
                $unwind: {
                  path: '$whitelist.whiteListAddresses',
                },
              },
              {
                $lookup: {
                  from: 'User',
                  localField: 'whitelist.whiteListAddresses.walletAddress',
                  foreignField: 'walletAddress',
                  as: 'user',
                },
              },
              {
                $unwind: {
                  path: '$user',
                },
              },
            ],
          },
        },
      ]);
      const iaoEvents: any[] = get(iaoEventSucceeded, [0, 'iaoEvents']);
      const addresses: any[] = get(iaoEventSucceeded, [0, 'addresses']);
      if (!iaoEvents.length) return;

      const addressesForVauld = addresses.filter(
        (a) => a.vaultType === VAULT_TYPE.VAULT,
      );
      const addressesForNonVauld = addresses.filter(
        (a) => a.vaultType === VAULT_TYPE.NON_VAULT,
      );

      // notification of Whitelist (VAULT)
      await this.createNotificationsForWhitelist(addressesForVauld, iaoEvents, {
        keySetting: 'iaoEvent',
        subtype: 'IAO_VAULT_SUCCEEDED',
        statusNoti: 'isIaoEventSucceededAnnounced',
        linkConfigMail: 'IAO_VAULT_SUCCESS',
        socketNamepcace: 'IAO_EVENT_SCHEDULE',
        socketEvent: 'IAO_EVENT_SUCCEEDED_EVENT',
      });

      // notification of Whitelist (NON-VAULT)
      await this.createNotificationsForWhitelist(
        addressesForNonVauld,
        iaoEvents,
        {
          keySetting: 'iaoEvent',
          subtype: 'IAO_NON_VAULT_SUCCEEDED',
          statusNoti: 'isIaoEventSucceededAnnounced',
          linkConfigMail: 'IAO_NON_VAULT_SUCCESS',
          socketNamepcace: 'IAO_EVENT_SCHEDULE',
          socketEvent: 'IAO_EVENT_SUCCEEDED_EVENT',
        },
      );
    } catch (err) {
      this.logger.error('sendIaoEventSucceededNotification');
      this.logger.error(err);
      this.logger.error(err?.stack);
    }
  }

  async sendIaoRevenueRejectedNotification(
    iaoEventId: string,
    session: ClientSession,
  ) {
    const iaoEventRejected: any[] = await this.dataService.iaoEvent.aggregate([
      {
        $match: {
          iaoEventId,
        },
      },
      {
        $lookup: {
          from: 'Whitelist',
          localField: 'iaoEventId',
          foreignField: 'iaoEventId',
          as: 'whitelist',
        },
      },
      {
        $unwind: {
          path: '$whitelist',
        },
      },
      {
        $facet: {
          iaoEvents: [
            {
              $project: {
                iaoEventId: 1,
                iaoEventName: 1,
                whitelist: 1,
              },
            },
          ],
          addresses: [
            {
              $unwind: {
                path: '$whitelist.whiteListAddresses',
              },
            },
            {
              $lookup: {
                from: 'User',
                localField: 'whitelist.whiteListAddresses.walletAddress',
                foreignField: 'walletAddress',
                as: 'user',
              },
            },
            {
              $unwind: {
                path: '$user',
              },
            },
          ],
        },
      },
    ]);
    const iaoEvents: any[] = get(iaoEventRejected, [0, 'iaoEvents']);
    const addresses: any[] = get(iaoEventRejected, [0, 'addresses']);
    if (!iaoEvents.length) return;

    const newNotifications = [];
    const userObj = {};

    for (const address of addresses) {
      if (address.user?.notificationSettings?.iaoEvent) {
        newNotifications.push(
          this._createSystemNotification(
            address.user.userId,
            NOTIFICATION_SUBTYPE.REJECT_IAO_REVENUE,
            {
              iaoEventId: address.iaoEventId,
              iaoEventName: address.iaoEventName,
            },
          ),
        );

        //add userObj
        if (!userObj[address.user.userId])
          userObj[address.user.userId] = address.user;
      }
    }
    const insertedNotifications =
      await this.dataService.notification.insertMany(newNotifications, {
        session,
      });

    const obj = {};
    for (const noti of insertedNotifications) {
      // add obj
      if (!obj[noti.extraData.iaoEventId])
        obj[noti.extraData.iaoEventId] = {
          iaoEventName: noti.extraData.iaoEventName,
          addresses: [],
        };

      // send mail
      const currentUser = userObj[noti.receiver];
      obj[noti.extraData.iaoEventId].addresses.push(currentUser.walletAddress);

      if (!currentUser?.email) continue;
      // sendMailRejectIaoRevenueToTrader
      const data = {
        bcc: currentUser.email,
        from: { name: EMAIL_CONFIG.FROM_EMAIL, address: process.env.MAIL_FROM },
        subject:
          EMAIL_CONFIG.TITLE.REJECT_IAO_REVENUE_TO_WHITELIST?.[
            currentUser.localization
          ],
        template: `./${EMAIL_CONFIG.DIR.REJECT_IAO_REVENUE_TO_WHITELIST}-${currentUser.localization}`,
        context: {
          eventName:
            noti.extraData.iaoEventName[currentUser.localization] ||
            noti.extraData.iaoEventName['en'],
          eventDetailUrl: `${process.env.TRADER_DOMAIN}/iao-event/${noti.extraData.iaoEventId}`,
          walletAddress: currentUser.walletAddress,
        },
      };
      await this.emailService.addQueue(data);
    }

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        // socket
        this.socketGateway.sendNotification(
          SOCKET_NAMESPACE.IAO_EVENT_SCHEDULE,
          SOCKET_NOTIFICATION_EVENT.REJECT_IAO_REVENUE_EVENT,
          key,
          obj[key].addresses,
          obj[key].iaoEventName,
        );
      }
    }

    return insertedNotifications;
  }

  async sendNotification(
    receivers: string[],
    notiQueue: NotificationQueue,
    session,
  ) {
    const data = receivers.map((receiver) => this.addData(receiver, notiQueue));
    return await this.dataService.notification.insertMany(data, {
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
      subtype: NOTIFICATION_SUBTYPE.ANNOUNCEMENT,
      extraData: {
        title: notiQueue.title,
        content: notiQueue.description,
      } as any,
    } as Notification;
  }

  private getMailFractor(fractors: Fractor[]): string[] {
    const frac = fractors.map((frac) => (frac.verified ? frac.email : null));
    return frac.filter((f) => f != null);
  }

  private getMailTrader(traders: User[]): string[] {
    const trader = traders.map((user) => (user.email ? user.email : null));
    return trader.filter((u) => u != null);
  }

  private async sendMailNotification(
    reciever: string | string[],
    title: string,
    context: object,
  ) {
    const mail = new Mail(
      EMAIL_CONFIG.FROM_EMAIL,
      EMAIL_CONFIG.DEFAUT_RECIVER,
      title,
      context,
      EMAIL_CONFIG.DIR.ANNOUNCEMENTS,
      'notification-queue',
      EMAIL_CONFIG.MAIL_REPLY_TO,
      reciever,
    );
    await this.emailService.sendMailFrac(mail);
  }

  private _createSystemNotification(
    receiver: string,
    subtype: NOTIFICATION_SUBTYPE,
    extraData: NotificationExtraData,
  ): NotificationEntity {
    return {
      type: NOTIFICATION_TYPE.SYSTEM_MESSAGES,
      receiver,
      title: null,
      content: null,
      notiQueueId: null,
      read: false,
      subtype,
      extraData,
      deleted: false,
      hided: false,
      dexId: null,
    };
  }

  private _createSystemNotificationForDex(
    walletAddress: string,
    uuid: string,
    type: NOTIFICATION_SUBTYPE,
    data: any,
  ) {
    const notificationForDex: NotificationForDexEntity = {
      walletAddress,
      uuid,
      type,
      data,
    };
    return notificationForDex;
  }

  private _createSystemNotificationSystemForDex(
    uuid: string,
    type: NOTIFICATION_SUBTYPE,
    data: any,
  ) {
    const notificationForDex: NotificationForDexEntity = {
      uuid,
      type,
      data,
    };
    return notificationForDex;
  }

  async sendNotificationForDex(insertedNotifications: Notification[]) {
    if (!insertedNotifications.length) return;
    const dataQuery = await this.dataService.notification.aggregate([
      {
        $match: {
          _id: {
            $in: insertedNotifications.map((item: any) => item._id),
          },
        },
      },
      {
        $lookup: {
          from: 'User',
          localField: 'receiver',
          foreignField: 'userId',
          as: 'user',
        },
      },
      {
        $unwind: '$user',
      },
    ]);
    const notificationsForDex: NotificationForDexEntity[] = dataQuery.map(
      (notification) =>
        this._createSystemNotificationForDex(
          notification.user.walletAddress,
          notification._id.toString(),
          notification.subtype,
          notification.extraData,
        ),
    );
    try {
      this.logger.log('Send notification to Dex with data', {
        data: notificationsForDex,
      });
      const res = await this.http.axiosRef.post(
        `${process.env.SPOT_DEX_DOMAIN}/api/v1/iao/notification`,
        { data: notificationsForDex },
        {
          headers: { 'api-key': `${process.env.SPOT_DEX_API_KEY}` },
        },
      );
      if (res.data)
        this.logger.log(
          `Send ${notificationsForDex.length} to Dex successfully`,
        );
    } catch (error) {
      this.logger.error('Send notification to DEX unsuccessfully');
      this.logger.error(error);
    }
  }

  async sendNotificationSystemForDex(insertedNotifications: any) {
    const notificationsForDex = this._createSystemNotificationSystemForDex(
      insertedNotifications.notiQueueId,
      NOTIFICATION_SUBTYPE.ANNOUNCEMENT,
      {
        title: insertedNotifications.title,
        content: insertedNotifications.description,
      },
    );
    try {
      this.logger.log('Send notification to Dex with data', {
        data: notificationsForDex,
      });
      const res = await this.http.axiosRef.post(
        `${process.env.SPOT_DEX_DOMAIN}/api/v1/iao/notification`,
        { data: [notificationsForDex] },
        {
          headers: { 'api-key': `${process.env.SPOT_DEX_API_KEY}` },
        },
      );
      if (res.data) this.logger.log(`Send to Dex successfully`);
    } catch (error) {
      this.logger.error('Send notification to DEX unsuccessfully');
      this.logger.error(error);
    }
  }
}
