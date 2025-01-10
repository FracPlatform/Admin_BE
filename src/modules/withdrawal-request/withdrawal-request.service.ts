import { Injectable, Logger } from '@nestjs/common';
import { ListDocument } from '../../common/common-type';
import {
  DEFAULT_LIMIT,
  DEFAULT_OFFET,
  DURATION_INVALID_ACTION_WITHDRAWAL_REQUEST,
  ErrorCode,
  LOCALIZATION,
  REVIEW_WITHDRAWAL_TYPE,
  SGD_ICON,
} from '../../common/constants';
import { IDataServices } from '../../core/abstracts/data-services.abstract';
import {
  FilterAffiliateWithdrawalRequestDto,
  FilterWithdrawalRequestDto,
  ReviewWithdrawalRequestDTO,
  UpdateWithdrawalRequestDTO,
} from './dto/withdrawal-request.dto';
import { get } from 'lodash';
import { ApiError } from '../../common/api';
import {
  Admin,
  AFFILIATE_WITHDRAWAL_REQUEST_STATUS,
  Fractor,
  PURCHASE_TYPE,
  WITHDRAWAL_REQUEST_STATUS,
  WithdrawalRequest,
} from '../../datalayer/model';
import { WithdrawalRequestBuilderService } from './withdrawal-request.factory.service';
import axios from 'axios';
import { SocketGateway } from '../../providers/socket/socket.gateway';
import {
  SOCKET_NAMESPACE,
  SOCKET_NOTIFICATION_EVENT,
} from '../../providers/socket/socket.enum';
import { EMAIL_CONFIG } from '../../common/email-config';
import { EmailService, Mail } from 'src/services/email/email.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Connection } from 'mongoose';
import { InjectConnection } from '@nestjs/mongoose';

@Injectable()
export class WithdrawalRequestService {
  private readonly logger = new Logger(WithdrawalRequestService.name);
  constructor(
    private readonly dataServices: IDataServices,
    private readonly withdrawalBuilderService: WithdrawalRequestBuilderService,
    private readonly socketGateway: SocketGateway,
    private readonly emailService: EmailService,
    @InjectConnection() private readonly connection: Connection,
  ) {}
  async getListWithdrawalFractor(filter: FilterWithdrawalRequestDto) {
    const query: any = {};

    if (filter.key) {
      query['$or'] = [
        { createdBy: { $regex: filter.key.trim(), $options: 'i' } },
        { requestId: { $regex: filter.key.trim(), $options: 'i' } },
      ];
    }

    if (filter.status) {
      const filterStatus = filter.status.split(',');
      const status: any = filterStatus.map((e) => parseInt(e));
      query['status'] = { $in: status };
    }

    if (filter.type) {
      query['revenueSource'] = filter.type;
    }

    const agg = [];

    agg.push(
      {
        $match: query,
      },
      {
        $lookup: {
          from: 'Fractor',
          let: { createdBy: '$createdBy' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$$createdBy', '$fractorId'] },
              },
            },
            { $project: { _id: 1, fullname: 1, fractorId: 1, avatar: 1 } },
          ],
          as: 'fractor',
        },
      },
      {
        $unwind: {
          path: '$fractor',
          preserveNullAndEmptyArrays: true,
        },
      },
    );

    let sort: any = { $sort: {} };
    if (filter.sortField && filter.sortType) {
      sort['$sort'][filter.sortField] = filter.sortType;
    } else {
      sort = { $sort: { createdAt: -1 } };
    }

    const dataReturnFilter = [sort, { $skip: filter.offset || DEFAULT_OFFET }];

    if (filter.limit !== -1)
      dataReturnFilter.push({ $limit: filter.limit || DEFAULT_LIMIT });

    agg.push({
      $facet: {
        count: [{ $count: 'count' }],
        data: dataReturnFilter,
      },
    });

    const dataQuery = await this.dataServices.withdrawalRequest.aggregate(agg, {
      collation: { locale: 'en' },
    });

    const data = get(dataQuery, [0, 'data']);
    const count = get(dataQuery, [0, 'count', 0, 'count']) || 0;

    return {
      totalDocs: count,
      docs: data || [],
    } as ListDocument;
  }

  async getListWithdrawalAffiliate(
    filter: FilterAffiliateWithdrawalRequestDto,
  ) {
    const query: any = {};

    if (filter.key) {
      query['$or'] = [
        { createdBy: { $regex: filter.key.trim(), $options: 'i' } },
        { requestId: { $regex: filter.key.trim(), $options: 'i' } },
      ];
    }

    if (filter.status) {
      const filterStatus = filter.status.split(',');
      const status: any = filterStatus.map((e) => parseInt(e));
      query['status'] = { $in: status };
    }

    const agg = [];

    agg.push(
      {
        $match: query,
      },
      {
        $lookup: {
          from: 'User',
          let: { createdBy: '$createdBy' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$$createdBy', '$userId'] },
              },
            },
            { $project: { _id: 1, walletAddress: 1, userId: 1 } },
          ],
          as: 'user',
        },
      },
      {
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: true,
        },
      },
    );

    let sort: any = { $sort: {} };
    if (filter.sortField && filter.sortType) {
      sort['$sort'][filter.sortField] = filter.sortType;
    } else {
      sort = { $sort: { createdAt: -1 } };
    }

    const dataReturnFilter = [sort, { $skip: filter.offset || DEFAULT_OFFET }];

    if (filter.limit !== -1)
      dataReturnFilter.push({ $limit: filter.limit || DEFAULT_LIMIT });

    agg.push({
      $facet: {
        count: [{ $count: 'count' }],
        data: dataReturnFilter,
      },
    });

    const dataQuery = await this.dataServices.userWithdrawalRequest.aggregate(
      agg,
      {
        collation: { locale: 'en' },
      },
    );

    const data = get(dataQuery, [0, 'data']);
    const count = get(dataQuery, [0, 'count', 0, 'count']) || 0;

    return {
      totalDocs: count,
      docs: data || [],
    } as ListDocument;
  }

  async getWithdrawalFractor(id: string) {
    const agg = [];
    agg.push(
      {
        $match: {
          requestId: id,
        },
      },
      {
        $lookup: {
          from: 'Fractor',
          let: { createdBy: '$createdBy' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$$createdBy', '$fractorId'] },
              },
            },
            {
              $project: {
                _id: 1,
                fullname: 1,
                fractorId: 1,
                avatar: 1,
                email: 1,
              },
            },
          ],
          as: 'fractor',
        },
      },
      {
        $unwind: {
          path: '$fractor',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'Admin',
          let: { reviewedBy: '$reviewedBy' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$$reviewedBy', '$adminId'] },
              },
            },
            { $project: { _id: 1, fullname: 1, adminId: 1, walletAddress: 1 } },
          ],
          as: 'admin',
        },
      },
      {
        $unwind: {
          path: '$admin',
          preserveNullAndEmptyArrays: true,
        },
      },
    );
    const dataQuery = await this.dataServices.withdrawalRequest.aggregate(agg, {
      collation: { locale: 'en' },
    });
    if (dataQuery.length < 1) {
      throw ApiError('', 'Not found withdrawal request');
    }
    return dataQuery[0];
  }

  async getWithdrawalAffiliate(id: string) {
    const agg = [];
    agg.push(
      {
        $match: {
          requestId: id,
        },
      },
      {
        $lookup: {
          from: 'User',
          let: { createdBy: '$createdBy' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$$createdBy', '$userId'] },
              },
            },
            { $project: { _id: 1, walletAddress: 1, userId: 1 } },
          ],
          as: 'user',
        },
      },
      {
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'Admin',
          let: { reviewedBy: '$reviewedBy' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$$reviewedBy', '$adminId'] },
              },
            },
            { $project: { _id: 1, fullname: 1, adminId: 1, walletAddress: 1 } },
          ],
          as: 'admin',
        },
      },
      {
        $unwind: {
          path: '$admin',
          preserveNullAndEmptyArrays: true,
        },
      },
    );
    const dataQuery = await this.dataServices.userWithdrawalRequest.aggregate(
      agg,
      {
        collation: { locale: 'en' },
      },
    );
    if (dataQuery.length < 1) {
      throw ApiError('', 'Not found withdrawal request');
    }
    return dataQuery[0];
  }

  _checkTimeValid() {
    const currentTime = new Date();
    const hours = currentTime.getUTCHours();
    const minute = currentTime.getUTCMinutes();

    if (process.env.NODE_ENV === 'dev') {
      if (minute >= 0 && minute <= DURATION_INVALID_ACTION_WITHDRAWAL_REQUEST) {
        throw ApiError(
          '',
          'Server is processing withdrawal request, can not cancel withdrawal request in this time',
        );
      }
    } else {
      if (
        minute >= 0 &&
        minute <= DURATION_INVALID_ACTION_WITHDRAWAL_REQUEST &&
        hours === 0
      ) {
        throw ApiError(
          '',
          'Server is processing withdrawal request, can not cancel withdrawal request in this time',
        );
      }
    }
  }

  async reviewWithdrawalFractor(
    id: string,
    data: ReviewWithdrawalRequestDTO,
    user: Admin,
  ) {
    if (data.type === REVIEW_WITHDRAWAL_TYPE.CANCEL && !data.comment) {
      throw ApiError('', 'Review comment is require when cancel request');
    }

    let withdrawal = await this.dataServices.withdrawalRequest.findOne({
      requestId: id,
    });
    if (!withdrawal) {
      throw ApiError('', 'Not found withdrawal request');
    }
    if (
      data.type === REVIEW_WITHDRAWAL_TYPE.CANCEL &&
      (withdrawal.status === WITHDRAWAL_REQUEST_STATUS.PROCESSING ||
        withdrawal.status === WITHDRAWAL_REQUEST_STATUS.PROCESSING_EXCHANGE)
    ) {
      this._checkTimeValid();
    }
    if (
      ![
        WITHDRAWAL_REQUEST_STATUS.IN_REVIEW,
        WITHDRAWAL_REQUEST_STATUS.PROCESSING,
        WITHDRAWAL_REQUEST_STATUS.REQUESTING,
      ].includes(withdrawal.status)
    ) {
      throw ApiError(
        ErrorCode.DEFAULT_ERROR,
        'Can not cancel this withdrawal request',
      );
    }

    if (withdrawal.exchangeRequestId && data.type === REVIEW_WITHDRAWAL_TYPE.CANCEL) {
      await axios.post(
        `${process.env.SPOT_DEX_DOMAIN}/api/v1/fractor-fee/withdrawal/cancel/${withdrawal.exchangeRequestId}`,
        {},
        {
          headers: {
            'API-Key': `${process.env.SPOT_DEX_API_KEY}`,
          },
        },
      );
    }

    let withdrawType = data.type;
    if (withdrawal.requestType === PURCHASE_TYPE.CRYPTO && withdrawType === REVIEW_WITHDRAWAL_TYPE.APPROVE) {
      withdrawType = WITHDRAWAL_REQUEST_STATUS.PROCESSING
    }
    withdrawal = await this.dataServices.withdrawalRequest.findOneAndUpdate(
      {
        requestId: id,
      },
      {
        $set: {
          reviewedBy: user.adminId,
          reviewComment: data?.comment,
          reviewedOn: new Date(),
          status: withdrawType,
          proofUrl: data?.proofUrl
        },
      },{
        new: true
      }
    );

    const fractor = await this.dataServices.fractor.findOne({
      fractorId: withdrawal.createdBy,
    });
    const mappedRevenue = withdrawal.revenue.map(
      ({ balance, acceptedCurrencySymbol }) => {
        return {
          balance,
          acceptedCurrencySymbol,
          logoUrl: SGD_ICON,
        };
      },
    );
    if (withdrawal.requestType === PURCHASE_TYPE.FIAT && withdrawType === REVIEW_WITHDRAWAL_TYPE.APPROVE) {
      await this._approveRequestWithdrawalByFiat(withdrawal, fractor, mappedRevenue);
    }

    // send notification
    if (data.type === REVIEW_WITHDRAWAL_TYPE.CANCEL) {
      await this._sendNotificationWhenCancel(withdrawal, null);

      let title = EMAIL_CONFIG.TITLE.CANCEL_WITHDRAWAL_REQUEST.EN;
      let template = EMAIL_CONFIG.TEMPLATE.CANCEL_WITHDRAWAL_REQUEST.EN;
      if (fractor.localization === LOCALIZATION.CN) {
        title = EMAIL_CONFIG.TITLE.CANCEL_WITHDRAWAL_REQUEST.CN;
        template = EMAIL_CONFIG.TEMPLATE.CANCEL_WITHDRAWAL_REQUEST.CN;
      }
      if (fractor.localization === LOCALIZATION.JP) {
        title = EMAIL_CONFIG.TITLE.CANCEL_WITHDRAWAL_REQUEST.JP;
        template = EMAIL_CONFIG.TEMPLATE.CANCEL_WITHDRAWAL_REQUEST.JP;
      }
      if (fractor.localization === LOCALIZATION.VN) {
        title = EMAIL_CONFIG.TITLE.CANCEL_WITHDRAWAL_REQUEST.VN;
        template = EMAIL_CONFIG.TEMPLATE.CANCEL_WITHDRAWAL_REQUEST.VN;
      }

      const context = {
        email: fractor.email,
        revenue: mappedRevenue,
        recipientBankName: withdrawal.recipientBankName,
        recipientAccountNumber: withdrawal.recipientAccountNumber,
        recipientAccountHolder: withdrawal.recipientAccountHolder,
        withdrawalRequestUrl: `${process.env.FRACTOR_DOMAIN}/${fractor.localization}/withdraw-request/${id}`,
        requestId: id,
        cancelReason: data.comment,
        fractorDomain: process.env.FRACTOR_DOMAIN,
        adminDomain: process.env.ADMIN_DOMAIN,
        traderDomain: process.env.TRADER_DOMAIN,
        landingPage: process.env.LANDING_PAGE,
        dexDomain: process.env.DEX_DOMAIN,
        contactUs: `${process.env.FRACTOR_DOMAIN}/${fractor.localization}/contact-us`,
        bscDomain: process.env.BSC_SCAN_DOMAIN,
      };

      const mail = new Mail(
        EMAIL_CONFIG.FROM_EMAIL,
        fractor.email,
        title,
        context,
        EMAIL_CONFIG.DIR.CANCEL_WITHDRAWAL_REQUEST,
        template,
        EMAIL_CONFIG.MAIL_REPLY_TO,
      );
      await this.emailService.sendMailFrac(mail);
    }
  }

  private async _approveRequestWithdrawalByFiat(withdrawal: WithdrawalRequest, fractor: Fractor, mappedRevenue: any) {
    const revenues = withdrawal.revenue;
    const session = await this.connection.startSession();
    session.startTransaction();
    await Promise.all(
      revenues.map(async (iaoEventId) => {
        try {

          await this.dataServices.fractor.findOneAndUpdate(
            {
              fractorId: withdrawal.createdBy,
              'revenueFiat.iaoEventId': iaoEventId,
            },
            {
              $set: {
                'revenueFiat.$.isWithdrawed': true,
              },
            },
            { session },
          );
        } catch (error) {
          
        }
      }),
    );

    await session.commitTransaction();

    let title = EMAIL_CONFIG.TITLE.WITHDRAWAL_REQUEST_SUCCEEDED.EN;
    let template = EMAIL_CONFIG.TEMPLATE.WITHDRAWAL_REQUEST.EN;
    if (fractor.localization === LOCALIZATION.CN) {
      title = EMAIL_CONFIG.TITLE.WITHDRAWAL_REQUEST_SUCCEEDED.CN;
      template = EMAIL_CONFIG.TEMPLATE.WITHDRAWAL_REQUEST.CN;
    }
    if (fractor.localization === LOCALIZATION.JP) {
      title = EMAIL_CONFIG.TITLE.WITHDRAWAL_REQUEST_SUCCEEDED.JP;
      template = EMAIL_CONFIG.TEMPLATE.WITHDRAWAL_REQUEST.JP;
    }
    if (fractor.localization === LOCALIZATION.VN) {
      title = EMAIL_CONFIG.TITLE.WITHDRAWAL_REQUEST_SUCCEEDED.VN;
      template = EMAIL_CONFIG.TEMPLATE.WITHDRAWAL_REQUEST.VN;
    }

    const context = {
      requestId: withdrawal.requestId,
      recipientName: fractor.fullname || '',
      recipientWalletAddress: withdrawal.recipientAddress,
      email: fractor.email,
      txHash: '',
      fractorDomain: process.env.FRACTOR_DOMAIN,
      adminDomain: process.env.ADMIN_DOMAIN,
      traderDomain: process.env.TRADER_DOMAIN,
      landingPage: process.env.LANDING_PAGE,
      dexDomain: process.env.DEX_DOMAIN,
      contactUs: `${process.env.TRADER_DOMAIN}/${fractor.localization}/contact-us`,
      bscDomain: process.env.BSC_SCAN_DOMAIN,
      localization: fractor.localization,
      revenue: mappedRevenue,
      recipientBankName: withdrawal.recipientBankName,
      recipientAccountNumber: withdrawal.recipientAccountNumber,
      recipientAccountHolder: withdrawal.recipientAccountHolder,
      isCrypto: withdrawal.requestType === PURCHASE_TYPE.CRYPTO,
      proofUrl: withdrawal.proofUrl
    };
    const mail = new Mail(
      EMAIL_CONFIG.FROM_EMAIL,
      fractor.email,
      title,
      context,
      EMAIL_CONFIG.DIR.WITHDRAWAL_REQUEST,
      template,
      EMAIL_CONFIG.MAIL_REPLY_TO,
    );
    await this.emailService.sendMailFrac(mail);
  }

  async reviewWithdrawalAffiliate(
    id: string,
    data: ReviewWithdrawalRequestDTO,
    user: Admin,
  ) {
    if (data.type === REVIEW_WITHDRAWAL_TYPE.CANCEL && !data.comment) {
      throw ApiError('', 'Review comment is require when cancel request');
    }

    const withdrawal = await this.dataServices.userWithdrawalRequest.findOne({
      requestId: id,
    });
    if (!withdrawal) {
      throw ApiError('', 'Not found withdrawal request');
    }
    if (
      data.type === REVIEW_WITHDRAWAL_TYPE.CANCEL &&
      (withdrawal.status === AFFILIATE_WITHDRAWAL_REQUEST_STATUS.PROCESSING ||
        withdrawal.status ===
          AFFILIATE_WITHDRAWAL_REQUEST_STATUS.PROCESSING_EXCHANGE)
    ) {
      this._checkTimeValid();
    }
    if (
      ![
        AFFILIATE_WITHDRAWAL_REQUEST_STATUS.IN_REVIEW,
        AFFILIATE_WITHDRAWAL_REQUEST_STATUS.PROCESSING,
      ].includes(withdrawal.status)
    ) {
      throw ApiError(
        ErrorCode.DEFAULT_ERROR,
        'Can not cancel this withdrawal request',
      );
    }

    await this.dataServices.userWithdrawalRequest.findOneAndUpdate(
      {
        requestId: id,
      },
      {
        $set: {
          reviewedBy: user.adminId,
          reviewComment: data?.comment,
          reviewedOn: new Date(),
          status:
            data.type === REVIEW_WITHDRAWAL_TYPE.APPROVE
              ? AFFILIATE_WITHDRAWAL_REQUEST_STATUS.PROCESSING
              : AFFILIATE_WITHDRAWAL_REQUEST_STATUS.CANCELED,
        },
      },
    );

    if (data.type === REVIEW_WITHDRAWAL_TYPE.CANCEL) {
      await this._sendNotificationWhenCancel(
        withdrawal,
        withdrawal.recipientAddress,
      );

      //send mail
      if (!!withdrawal.emailReveiceNotification) {
        const user = await this.dataServices.user.findOne({
          userId: withdrawal.createdBy,
        });

        let title = EMAIL_CONFIG.TITLE.CANCEL_WITHDRAWAL_REQUEST.EN;
        let template = EMAIL_CONFIG.TEMPLATE.CANCEL_WITHDRAWAL_REQUEST.EN;
        if (user.localization === LOCALIZATION.CN) {
          title = EMAIL_CONFIG.TITLE.CANCEL_WITHDRAWAL_REQUEST.CN;
          template = EMAIL_CONFIG.TEMPLATE.CANCEL_WITHDRAWAL_REQUEST.CN;
        }
        if (user.localization === LOCALIZATION.JP) {
          title = EMAIL_CONFIG.TITLE.CANCEL_WITHDRAWAL_REQUEST.JP;
          template = EMAIL_CONFIG.TEMPLATE.CANCEL_WITHDRAWAL_REQUEST.JP;
        }
        if (user.localization === LOCALIZATION.VN) {
          title = EMAIL_CONFIG.TITLE.CANCEL_WITHDRAWAL_REQUEST.VN;
          template = EMAIL_CONFIG.TEMPLATE.CANCEL_WITHDRAWAL_REQUEST.VN;
        }

        const context = {
          withdrawalRequestUrl: `${process.env.TRADER_DOMAIN}/${user.localization}/withdraw-request/${id}`,
          requestId: id,
          cancelReason: data.comment,
          fractorDomain: process.env.FRACTOR_DOMAIN,
          adminDomain: process.env.ADMIN_DOMAIN,
          traderDomain: process.env.TRADER_DOMAIN,
          landingPage: process.env.LANDING_PAGE,
          dexDomain: process.env.DEX_DOMAIN,
          contactUs: `${process.env.TRADER_DOMAIN}/${user.localization}/contact-us`,
          bscDomain: process.env.BSC_SCAN_DOMAIN,
        };

        const mail = new Mail(
          EMAIL_CONFIG.FROM_EMAIL,
          withdrawal.emailReveiceNotification,
          title,
          context,
          EMAIL_CONFIG.DIR.CANCEL_WITHDRAWAL_REQUEST,
          template,
          EMAIL_CONFIG.MAIL_REPLY_TO,
        );
        await this.emailService.sendMailFrac(mail);
      }
    }
  }

  async editWithdrawalAffiliate(id: string, body: UpdateWithdrawalRequestDTO) {
    const withdrawal = await this.dataServices.userWithdrawalRequest.findOne({
      requestId: id,
    });
    if (!withdrawal) {
      throw ApiError('', 'Not found withdrawal request');
    }

    await this.dataServices.userWithdrawalRequest.updateOne(
      { requestId: id },
      {
        $set: { reviewComment: body.comment },
      },
    );
  }

  async editWithdrawalFractor(id: string, body: UpdateWithdrawalRequestDTO) {
    const withdrawal = await this.dataServices.withdrawalRequest.findOne({
      requestId: id,
    });
    if (!withdrawal) {
      throw ApiError('', 'Not found withdrawal request');
    }

    await this.dataServices.withdrawalRequest.updateOne(
      { requestId: id },
      {
        $set: { reviewComment: body.comment },
      },
    );
  }

  async _sendNotificationWhenCancel(request: any, walletAddress: string) {
    // create notificaation in IAO
    const notification =
      this.withdrawalBuilderService.createCancelWithdrawalRequest(
        request.requestId,
        request.createdBy,
      );
    const dataNoti = await this.dataServices.notification.create(notification);

    //push notification to DEX
    if (walletAddress) {
      const notificationForDex =
        this.withdrawalBuilderService._createSystemNotificationForDex(
          walletAddress,
          dataNoti[0]._id.toString(),
          notification.subtype,
          notification.extraData,
        );

      try {
        this.logger.log('Send notification to Dex with data', {
          data: notificationForDex,
        });
        const res = await axios.post(
          `${process.env.SPOT_DEX_DOMAIN}/api/v1/iao/notification`,
          { data: [notificationForDex] },
          {
            headers: { 'api-key': `${process.env.SPOT_DEX_API_KEY}` },
          },
        );
        if (res.data) this.logger.log(`Send notification to Dex successfully`);
      } catch (error) {
        this.logger.error('Send notification to DEX unsuccessfully');
        this.logger.error(error);
      }
    }

    //send socket
    this.socketGateway.sendNotification(
      SOCKET_NAMESPACE.ANNOUNCEMENT,
      `${SOCKET_NOTIFICATION_EVENT.CANCEL_WITHDRAWAL}_${request.createdBy}`,
      dataNoti[0],
    );
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async _executeValidateWithdrawalRequest() {
    const withdrawals = await this.dataServices.withdrawalRequest.findMany({
      $expr: {
        $gt: ['$$NOW', { $add: ['$requestedOn', 10 * 60 * 1000] }],
      },
      status: WITHDRAWAL_REQUEST_STATUS.REQUESTING,
    });
    await this.dataServices.withdrawalRequest.updateMany(
      {
        $expr: {
          $gt: ['$$NOW', { $add: ['$requestedOn', 10 * 60 * 1000] }],
        },
        status: WITHDRAWAL_REQUEST_STATUS.REQUESTING,
      },
      {
        status: WITHDRAWAL_REQUEST_STATUS.CANCELED,
      },
    );

    for (const withdrawal of withdrawals) {
      if (withdrawal.exchangeRequestId) {
        axios.post(
          `${process.env.SPOT_DEX_DOMAIN}/api/v1/fractor-fee/withdrawal/cancel/${withdrawal.exchangeRequestId}`,
          {},
          {
            headers: {
              'API-Key': `${process.env.SPOT_DEX_API_KEY}`,
            },
          },
        );
      }
    }
  }
}
