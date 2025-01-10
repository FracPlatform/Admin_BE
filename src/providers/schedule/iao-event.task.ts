import { IDataServices } from 'src/core/abstracts/data-services.abstract';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  VAULT_TYPE,
  ASSET_STATUS,
  CUSTODIANSHIP_STATUS,
  CategoryType,
  REVENUE_STATUS,
  Fractor,
  IAOEvent,
  NOTIFICATION_SUBTYPE,
  ADMIN_STATUS,
  NOTIFICATION_TYPE,
  IAORequest,
  Asset,
  ON_CHAIN_STATUS,
} from 'src/datalayer/model';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { MailService } from 'src/services/mail/mail.service';
import { S3Service } from 'src/s3/s3.service';
import { IaoRequestBuilderService } from 'src/modules/iao-request/iao-request.factory.service';
import { SocketGateway } from '../socket/socket.gateway';
import {
  SOCKET_NAMESPACE,
  SOCKET_NOTIFICATION_EVENT,
} from '../socket/socket.enum';
import { Role } from 'src/modules/auth/role.enum';
import { EMAIL_CONFIG } from 'src/common/email-config';
import { LOCALIZATION, SECONDS_IN_A_DAY } from 'src/common/constants';
import { EmailService } from 'src/services/email/email.service';
@Injectable()
export class IAOEventTask {
  private readonly logger = new Logger(IAOEventTask.name);
  constructor(
    private readonly dataService: IDataServices,
    private readonly s3Service: S3Service,
    private readonly mailService: MailService,
    private readonly iaoRequestBuilderService: IaoRequestBuilderService,
    private readonly socketGateway: SocketGateway,
    private readonly emailService: EmailService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    try {
      this.logger.log('Start job update iao event');
      const nowDate = new Date();
      const query = {
        participationEndTime: { $lte: nowDate },
        isCron: false,
        isDeleted: false,
      };

      const iaoEvent = await this.dataService.iaoEvent.aggregate([
        { $match: query },
        {
          $lookup: {
            from: 'Fractor',
            let: { fractorId: '$fractorId' },
            pipeline: [
              { $match: { $expr: { $eq: ['$fractorId', '$$fractorId'] } } },
            ],
            as: 'fractors',
          },
        },
        {
          $addFields: {
            fractor: { $arrayElemAt: ['$fractors', 0] },
          },
        },
      ]);

      const completedIAOEvent = iaoEvent.filter(
        (iao) =>
          iao.vaultType === VAULT_TYPE.NON_VAULT ||
          (iao.vaultType === VAULT_TYPE.VAULT &&
            iao.totalSupply - iao.availableSupply >=
              iao.vaultUnlockThreshold * iao.totalSupply * 0.01),
      );
      const failIAOEvent = iaoEvent.filter(
        (iao) =>
          iao.vaultType === VAULT_TYPE.VAULT &&
          iao.totalSupply - iao.availableSupply <
            iao.vaultUnlockThreshold * iao.totalSupply * 0.01,
      );

      this.logger.log(
        `Data ${JSON.stringify({
          total: iaoEvent?.length,
          completed: completedIAOEvent.length,
          fail: failIAOEvent.length,
        })}`,
      );

      await Promise.all([
        this.handleCompletedIAOEvent(completedIAOEvent),
        this.handleFailIAOEvent(failIAOEvent),
        this.handleCronUpdateIaoRevenueStatus(),
        this.updateAssetFailed(),
        this.updateAssetSuccess(),
        this.handleDeleteFileFromServer(),
      ]);

      await this.dataService.iaoEvent.updateMany(
        {
          iaoEventId: { $in: iaoEvent.map((iao) => iao?.iaoEventId) },
        },
        { $set: { isCron: true } },
      );

      this.logger.log('Completed job update iao event');
    } catch (err) {
      this.logger.error(err);
      this.logger.error(err?.stack);
    }
  }

  async handleCompletedIAOEvent(iaoEvent) {
    const isCompleted = true;
    const isVault = true;

    const vaultIAOEvent = iaoEvent.filter(
      (iao) =>
        iao.vaultType === VAULT_TYPE.VAULT &&
        iao.fractor?.notificationSettings?.iaoEventResult,
    );
    const nonVaultIAOEvent = iaoEvent.filter(
      (iao) =>
        iao.vaultType === VAULT_TYPE.NON_VAULT &&
        iao.fractor?.notificationSettings?.iaoEventResult,
    );

    // vault
    await this.insertManyNotification(
      vaultIAOEvent,
      SOCKET_NOTIFICATION_EVENT.FRACTOR_IAO_EVENT_SUCCEEDED_EVENT,
      NOTIFICATION_SUBTYPE.IAO_VAULT_SUCCEEDED,
    );
    await this.sendMail(vaultIAOEvent, isCompleted, isVault);

    // non vault
    await this.insertManyNotification(
      nonVaultIAOEvent,
      SOCKET_NOTIFICATION_EVENT.FRACTOR_IAO_EVENT_NON_VAULT_SUCCEEDED_EVENT,
      NOTIFICATION_SUBTYPE.IAO_NON_VAULT_SUCCEEDED,
    );
    await this.sendMail(nonVaultIAOEvent, isCompleted, !isVault);

    // send notification & mail to admin.
    await this.createNotifications(true, iaoEvent);
    return iaoEvent;
  }

  async handleFailIAOEvent(iaoEvent) {
    const isCompleted = false;

    const iaoEventForSendNotification = iaoEvent.filter(
      (iao) => iao.fractor.notificationSettings?.iaoEventResult,
    );

    await this.insertManyNotification(
      iaoEventForSendNotification,
      SOCKET_NOTIFICATION_EVENT.FRACTOR_IAO_EVENT_FAILED_EVENT,
      NOTIFICATION_SUBTYPE.IAO_VAULT_FAILED,
    );

    await this.sendMail(iaoEventForSendNotification, isCompleted);

    // send notification & mail to admin.
    await this.createNotifications(false, iaoEvent);

    await this.dataService.iaoEvent.updateMany(
      {
        iaoEventId: {
          $in: iaoEvent.map((iao: any) => iao.iaoEventId),
        },
      },
      {
        $set: {
          failedOn: new Date(),
        },
      },
    );

    return iaoEvent;
  }

  async createNotifications(isSuccess: boolean, listIaoEvent) {
    const newNotifications = [];

    const listAdmin = await this.dataService.admin.findMany({
      role: {
        $in: [Role.SuperAdmin, Role.OperationAdmin, Role.OWNER],
      },
      status: ADMIN_STATUS.ACTIVE,
      deleted: false,
    });

    for (const iaoE of listIaoEvent) {
      let subtype;
      if (isSuccess && iaoE.vaultType === VAULT_TYPE.VAULT) {
        subtype = NOTIFICATION_SUBTYPE.IAO_VAULT_SUCCEEDED;
      } else if (!isSuccess && iaoE.vaultType === VAULT_TYPE.VAULT) {
        subtype = NOTIFICATION_SUBTYPE.IAO_VAULT_FAILED;
      } else {
        subtype = NOTIFICATION_SUBTYPE.IAO_NON_VAULT_SUCCEEDED;
      }

      listAdmin.forEach((a) => {
        newNotifications.push({
          type: NOTIFICATION_TYPE.ANNOUNCEMENT,
          receiver: a.adminId,
          subtype,
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

    const listNewNotification = await this.dataService.notification.insertMany(
      newNotifications,
    );

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
          SOCKET_NOTIFICATION_EVENT.PARTICIPATION_END_TIME_EVENT,
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
      let subject = EMAIL_CONFIG.TITLE.IAO_EVENT_NON_VAULT_COMPLETED;
      let template = `./${EMAIL_CONFIG.DIR.IAO_EVENT_NON_VAULT_COMPLETED}`;
      if (isSuccess && iaoE.vaultType === VAULT_TYPE.VAULT) {
        subject = EMAIL_CONFIG.TITLE.IAO_EVENT_VAULT_COMPLETED;
        template = `./${EMAIL_CONFIG.DIR.IAO_EVENT_VAULT_COMPLETED}`;
      }
      if (!isSuccess && iaoE.vaultType === VAULT_TYPE.VAULT) {
        subject = EMAIL_CONFIG.TITLE.IAO_EVENT_VAULT_FAILED;
        template = `./${EMAIL_CONFIG.DIR.IAO_EVENT_VAULT_FAILED}`;
      }

      // sendMailParticipationEndTimeToAdmin
      const data = {
        bcc: listMail,
        from: { name: EMAIL_CONFIG.FROM_EMAIL, address: process.env.MAIL_FROM },
        subject,
        template,
        context: {
          eventName: iaoE.iaoEventName['en'],
          eventDetailUrl: `${process.env.ADMIN_DOMAIN}/iao-event/${iaoE.iaoEventId}`,
          eventRevenueUrl: `${process.env.ADMIN_DOMAIN}/iao-revenue/${iaoE.iaoEventId}`,
        },
      };
      await this.emailService.addQueue(data);
    }
  }

  async handleCronUpdateIaoRevenueStatus() {
    const completedIaoEvents = await this.dataService.iaoEvent.aggregate([
      {
        $match: {
          'revenue.status': REVENUE_STATUS.PENDING,
          onChainStatus: ON_CHAIN_STATUS.ON_CHAIN,
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
    ]);
    const failedIaoEvents = await this.dataService.iaoEvent.aggregate([
      {
        $match: {
          'revenue.status': REVENUE_STATUS.PENDING,
          onChainStatus: ON_CHAIN_STATUS.ON_CHAIN,
          $and: [
            {
              participationEndTime: {
                $lte: new Date(),
              },
            },
            {
              $expr: {
                $lt: [
                  { $subtract: ['$totalSupply', '$availableSupply'] },
                  {
                    $multiply: ['$vaultUnlockThreshold', '$totalSupply', 0.01],
                  },
                ],
              },
            },
          ],
        },
      },
    ]);
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      if (completedIaoEvents.length) {
        await this.dataService.iaoEvent.updateMany(
          {
            iaoEventId: {
              $in: completedIaoEvents.map((iaoEvent) => iaoEvent.iaoEventId),
            },
          },
          {
            'revenue.status': REVENUE_STATUS.IN_REVIEW,
          },
          { session },
        );
      }
      if (failedIaoEvents.length) {
        await this.dataService.iaoEvent.updateMany(
          {
            iaoEventId: {
              $in: failedIaoEvents.map((iaoEvent) => iaoEvent.iaoEventId),
            },
          },
          {
            'revenue.status': REVENUE_STATUS.CLOSED,
          },
          { session },
        );
      }
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
    } finally {
      await session.endSession();
    }
  }

  async insertManyNotification(iaoEvent: IAOEvent[], event, subtype) {
    // notification
    const notiList = [];
    for (let i = 0; i < iaoEvent.length; i++) {
      notiList.push(
        this.iaoRequestBuilderService.createNotificationForIAOEvent(
          iaoEvent[i].fractorId,
          iaoEvent[i].iaoEventName,
          iaoEvent[i].iaoEventId,
          subtype,
        ),
      );
    }
    const data: any = await this.dataService.notification.insertMany(notiList);

    // socket
    const obj = {};
    for (let i = 0; i < data.length; i++) {
      if (!obj[data[i].receiver]) obj[data[i].receiver] = [];
      obj[data[i].receiver].push(data[i]);
    }

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        this.socketGateway.sendNotification(
          SOCKET_NAMESPACE.IAO_EVENT_RESULT,
          `${event}_${key}`,
          obj[key],
        );
      }
    }
    //
  }

  async sendMail(iaoEvent, isCompleted, isVault?) {
    const fractorIAOEvent = await this.dataService.iaoEvent.aggregate([
      {
        $match: { iaoEventId: { $in: iaoEvent.map((iao) => iao.iaoEventId) } },
      },
      {
        $lookup: {
          from: Fractor.name,
          let: { fractorId: '$fractorId' },
          pipeline: [
            { $match: { $expr: { $eq: ['$fractorId', '$$fractorId'] } } },
            { $project: { email: 1, localization: 1 } },
          ],
          as: 'fractors',
        },
      },
      {
        $addFields: {
          fractor: { $arrayElemAt: ['$fractors', 0] },
        },
      },
    ]);
    for (let i = 0; i < fractorIAOEvent.length; i++) {
      if (fractorIAOEvent[i].fractor.email)
        if (!isCompleted) {
          const data = this.createTemplateVaultFail(
            fractorIAOEvent[i].fractor.email,
            fractorIAOEvent[i].iaoEventName,
            fractorIAOEvent[i].iaoEventId,
            fractorIAOEvent[i].fractor.localization,
          );
          await this.emailService.addQueue(data);
        } else {
          if (isVault) {
            const data = this.createTemplateVaultSuccess(
              fractorIAOEvent[i].fractor.email,
              fractorIAOEvent[i].iaoEventName,
              fractorIAOEvent[i].iaoEventId,
              fractorIAOEvent[i].fractor.localization,
            );
            await this.emailService.addQueue(data);
          } else {
            const data = this.createTemplateNonVaultSuccess(
              fractorIAOEvent[i].fractor.email,
              fractorIAOEvent[i].iaoEventName,
              fractorIAOEvent[i].iaoEventId,
              fractorIAOEvent[i].fractor.localization,
            );
            await this.emailService.addQueue(data);
          }
        }
    }
  }

  createTemplateVaultSuccess(email, eventName, iaoeventId, localization) {
    let template = EMAIL_CONFIG.DIR.VAULT_IAO_HAS_COMPLETED.EN;
    let subject = EMAIL_CONFIG.TITLE.VAULT_IAO_HAS_COMPLETED.EN;
    let iaoEventName = eventName.en;
    const eventDetailUrl = `${process.env.TRADER_DOMAIN}/${localization}/iao-event/${iaoeventId}`;

    if (localization === LOCALIZATION.CN) {
      template = EMAIL_CONFIG.DIR.VAULT_IAO_HAS_COMPLETED.CN;
      subject = EMAIL_CONFIG.TITLE.VAULT_IAO_HAS_COMPLETED.CN;
      iaoEventName = eventName.cn || eventName.en;
    }
    if (localization === LOCALIZATION.JP) {
      template = EMAIL_CONFIG.DIR.VAULT_IAO_HAS_COMPLETED.JA;
      subject = EMAIL_CONFIG.TITLE.VAULT_IAO_HAS_COMPLETED.JP;
      iaoEventName = eventName.jp || eventName.en;
    }
    if (localization === LOCALIZATION.VN) {
      template = EMAIL_CONFIG.DIR.VAULT_IAO_HAS_COMPLETED.VI;
      subject = EMAIL_CONFIG.TITLE.VAULT_IAO_HAS_COMPLETED.VN;
      iaoEventName = eventName.vn || eventName.en;
    }
    return {
      to: email,
      from: { name: EMAIL_CONFIG.FROM_EMAIL, address: process.env.MAIL_FROM },
      subject,
      template,
      context: {
        eventName: iaoEventName,
        eventDetailUrl,
        localization: localization,
      },
    };
  }

  createTemplateVaultFail(email, eventName, iaoeventId, localization) {
    let template = EMAIL_CONFIG.DIR.VAULT_IAO_HAS_FAILED.EN;
    let subject = EMAIL_CONFIG.TITLE.VAULT_IAO_HAS_FAILED.EN;
    let iaoEventName = eventName.en;
    const eventDetailUrl = `${process.env.TRADER_DOMAIN}/iao-event/${iaoeventId}`;

    if (localization === LOCALIZATION.CN) {
      template = EMAIL_CONFIG.DIR.VAULT_IAO_HAS_FAILED.CN;
      subject = EMAIL_CONFIG.TITLE.VAULT_IAO_HAS_FAILED.CN;
      iaoEventName = eventName.cn || eventName.en;
    }
    if (localization === LOCALIZATION.JP) {
      template = EMAIL_CONFIG.DIR.VAULT_IAO_HAS_FAILED.JA;
      subject = EMAIL_CONFIG.TITLE.VAULT_IAO_HAS_FAILED.JP;
      iaoEventName = eventName.jp || eventName.en;
    }
    if (localization === LOCALIZATION.VN) {
      template = EMAIL_CONFIG.DIR.VAULT_IAO_HAS_FAILED.VI;
      subject = EMAIL_CONFIG.TITLE.VAULT_IAO_HAS_FAILED.VN;
      iaoEventName = eventName.vn || eventName.en;
    }
    return {
      to: email,
      from: { name: EMAIL_CONFIG.FROM_EMAIL, address: process.env.MAIL_FROM },
      subject,
      template,
      context: {
        eventName: iaoEventName,
        eventDetailUrl,
        localization: localization,
      },
    };
  }

  createTemplateNonVaultSuccess(email, eventName, iaoeventId, localization) {
    let template = EMAIL_CONFIG.DIR.NON_VAULT_IAO_HAS_COMPLETED.EN;
    let subject = EMAIL_CONFIG.TITLE.NON_VAULT_IAO_HAS_COMPLETED.EN;
    let iaoEventName = eventName.en;
    const eventDetailUrl = `${process.env.TRADER_DOMAIN}/iao-event/${iaoeventId}`;

    if (localization === LOCALIZATION.CN) {
      template = EMAIL_CONFIG.DIR.NON_VAULT_IAO_HAS_COMPLETED.CN;
      subject = EMAIL_CONFIG.TITLE.NON_VAULT_IAO_HAS_COMPLETED.CN;
      iaoEventName = eventName.cn || eventName.en;
    }
    if (localization === LOCALIZATION.JP) {
      template = EMAIL_CONFIG.DIR.NON_VAULT_IAO_HAS_COMPLETED.JA;
      subject = EMAIL_CONFIG.TITLE.NON_VAULT_IAO_HAS_COMPLETED.JP;
      iaoEventName = eventName.jp || eventName.en;
    }
    if (localization === LOCALIZATION.VN) {
      template = EMAIL_CONFIG.DIR.NON_VAULT_IAO_HAS_COMPLETED.VI;
      subject = EMAIL_CONFIG.TITLE.NON_VAULT_IAO_HAS_COMPLETED.VN;
      iaoEventName = eventName.vn || eventName.en;
    }

    return {
      to: email,
      from: { name: EMAIL_CONFIG.FROM_EMAIL, address: process.env.MAIL_FROM },
      subject,
      template,
      context: {
        eventName: iaoEventName,
        eventDetailUrl,
        contactUs: `${process.env.FRACTOR_DOMAIN}/${localization}/contact-us`,
      },
    };
  }

  async updateCustodianshipToFractor(items) {
    await this.dataService.asset.updateMany(
      {
        itemId: { $in: items },
        $or: [
          {
            category: CategoryType.VIRTUAL,
            isMintNFT: false,
          },
          {
            'custodianship.storedByFrac': 0,
            category: CategoryType.PHYSICAL,
          },
        ],
      },
      { 'custodianship.status': CUSTODIANSHIP_STATUS.FRACTOR },
    );
  }

  async updateCustodianshipToAvailableForFractorToReDeem(items) {
    await this.dataService.asset.updateMany(
      {
        itemId: { $in: items },
        $or: [
          { category: CategoryType.VIRTUAL, isMintNFT: true },
          {
            'custodianship.storedByFrac': 1,
            category: CategoryType.PHYSICAL,
          },
        ],
      },
      {
        'custodianship.status':
          CUSTODIANSHIP_STATUS.AVAILABLE_FOR_FRACTOR_TO_REDEEM,
      },
    );
  }

  async deleteFileS3NonNFT(items) {
    const asset = await this.dataService.asset.findMany({
      itemId: { $in: items },
      category: CategoryType.VIRTUAL,
      isMintNFT: false,
    });
    let urlList = [];
    asset.forEach((item) => {
      const files = item?.custodianship?.files.map((file) => file.fileUrl);
      urlList = urlList.concat(files);
    });
    const deleteFileS3 = [];
    for (let i = 0; i < urlList.length; i++) {
      deleteFileS3.push(this.s3Service.deleteFile(urlList[i]));
    }
    if (deleteFileS3.length > 0) {
      this.logger.debug('Delete file s3', urlList);
      await Promise.all(deleteFileS3);
    }
  }

  async updateAssetFailed() {
    const iaoEventList = await this.dataService.iaoEvent.aggregate([
      {
        $match: {
          $and: [
            {
              participationEndTime: {
                $lte: new Date(),
              },
              vaultType: VAULT_TYPE.VAULT,
              isDeleted: false,
            },
            {
              $expr: {
                $lt: [
                  { $subtract: ['$totalSupply', '$availableSupply'] },
                  {
                    $multiply: ['$vaultUnlockThreshold', '$totalSupply', 0.01],
                  },
                ],
              },
            },
          ],
        },
      },
      { $project: { _id: 1, iaoRequestId: 1 } },
      {
        $lookup: {
          from: IAORequest.name,
          let: { iaoRequestId: '$iaoRequestId' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$$iaoRequestId', '$iaoId'] },
              },
            },
            { $project: { _id: 1, items: 1 } },
          ],
          as: 'iaoRequests',
        },
      },
      {
        $addFields: {
          iaoRequest: { $arrayElemAt: ['$iaoRequests', 0] },
        },
      },
      {
        $addFields: {
          items: '$iaoRequest.items',
        },
      },
      {
        $unwind: '$items',
      },
      {
        $lookup: {
          from: Asset.name,
          let: { itemId: '$items' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$itemId', '$$itemId'] },
              },
            },
            { $project: { _id: 1, itemId: 1, status: 1 } },
          ],
          as: 'lookupItems',
        },
      },
      {
        $addFields: {
          item: { $arrayElemAt: ['$lookupItems', 0] },
        },
      },
      { $match: { 'item.status': ASSET_STATUS.IAO_EVENT } },
      { $project: { item: 1 } },
    ]);
    const items = iaoEventList.map((iao) => iao?.item?.itemId);

    await this.dataService.asset.updateMany(
      { itemId: { $in: items } },
      { $set: { status: ASSET_STATUS.OPEN } },
    );

    await this.updateCustodianshipToFractor(items);

    await this.updateCustodianshipToAvailableForFractorToReDeem(items);

    await this.deleteFileS3NonNFT(items);
  }

  async updateAssetSuccess() {
    const iaoEventList = await this.dataService.iaoEvent.aggregate([
      {
        $match: {
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
      { $project: { _id: 1, iaoRequestId: 1 } },
      {
        $lookup: {
          from: IAORequest.name,
          let: { iaoRequestId: '$iaoRequestId' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$$iaoRequestId', '$iaoId'] },
              },
            },
            { $project: { _id: 1, items: 1 } },
          ],
          as: 'iaoRequests',
        },
      },
      {
        $addFields: {
          iaoRequest: { $arrayElemAt: ['$iaoRequests', 0] },
        },
      },
      {
        $addFields: {
          items: '$iaoRequest.items',
        },
      },
      {
        $unwind: '$items',
      },
      {
        $lookup: {
          from: Asset.name,
          let: { itemId: '$items' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$itemId', '$$itemId'] },
              },
            },
            { $project: { _id: 1, itemId: 1, status: 1 } },
          ],
          as: 'lookupItems',
        },
      },
      {
        $addFields: {
          item: { $arrayElemAt: ['$lookupItems', 0] },
        },
      },
      { $match: { 'item.status': ASSET_STATUS.IAO_EVENT } },
      { $project: { item: 1 } },
    ]);
    const items = iaoEventList.map((iao) => iao?.item?.itemId);

    await this.dataService.asset.updateMany(
      { itemId: { $in: items } },
      { $set: { status: ASSET_STATUS.EXCHANGE } },
    );
  }

  async handleDeleteFileFromServer() {
    const iaoEventToDelete = await this.dataService.iaoEvent.findMany({
      isAllFileDeleted: false,
      failedOn: {
        $lte: new Date(Date.now() - SECONDS_IN_A_DAY * 1000 * 7),
      },
    });

    const fileToDelete = await this.dataService.iaoEvent.aggregate([
      {
        $match: {
          iaoEventId: {
            $in: iaoEventToDelete.map((event) => event.iaoEventId),
          },
        },
      },
      {
        $lookup: {
          from: 'IAORequest',
          localField: 'iaoRequestId',
          foreignField: 'iaoId',
          as: 'iaoRequest',
        },
      },
      {
        $unwind: '$iaoRequest',
      },
      {
        $lookup: {
          from: 'Asset',
          let: { id: '$iaoRequest.iaoId' },
          pipeline: [
            {
              $match: {
                category: CategoryType.VIRTUAL,
                isMintNFT: false,
                $expr: {
                  $eq: ['$iaoRequestId', '$$id'],
                },
              },
            },
          ],
          as: 'items',
        },
      },
      {
        $unwind: '$items',
      },
      {
        $match: {
          $expr: {
            $gt: [{ $size: '$items.custodianship.files' }, 0],
          },
        },
      },
      {
        $project: {
          itemId: '$items.itemId',
        },
      },
    ]);
    if (!fileToDelete.length) return;
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      await this.dataService.asset.updateMany(
        {
          itemId: {
            $in: fileToDelete.map((file) => file.itemId),
          },
        },
        {
          $set: {
            'custodianship.files': [],
          },
        },
        { session },
      );
      await this.dataService.iaoEvent.updateMany(
        {
          iaoEventId: {
            $in: iaoEventToDelete.map((event) => event.iaoEventId),
          },
        },
        {
          $set: {
            isAllFileDeleted: true,
          },
        },
        { session },
      );
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
    } finally {
      await session.endSession();
    }
  }
}
