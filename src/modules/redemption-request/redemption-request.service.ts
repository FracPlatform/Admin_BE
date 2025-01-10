import {
  SOCKET_NAMESPACE,
  SOCKET_NOTIFICATION_EVENT,
} from './../../providers/socket/socket.enum';
import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { get } from 'lodash';
import {
  DEFAULT_LIMIT,
  DEFAULT_OFFET,
  ErrorCode,
  LOCALIZATION,
  PREFIX_ID,
  REDEMPTION_REQUEST_TYPE,
} from 'src/common/constants';
import { IDataServices } from 'src/core/abstracts/data-services.abstract';
import { ListDocument } from '../iao-request/iao-request.service';
import {
  ChangeStatusDto,
  FilterRedemptionRequestDto,
  UpdateCommentDto,
} from './dto/redemption-request.dto';
import { RedemptionRequestBuilderService } from './redemption-request.factory.service';
import { ApiError } from 'src/common/api';
import {
  ASSET_STATUS,
  CategoryType,
  CUSTODIANSHIP_STATUS,
  NFT_STATUS,
  NOTIFICATION_SUBTYPE,
  NOTIFICATION_TYPE,
  REDEMPTION_REQUEST_STATUS,
} from 'src/datalayer/model';
import { SocketGateway } from 'src/providers/socket/socket.gateway';
import { EmailService, Mail } from 'src/services/email/email.service';
import { EMAIL_CONFIG } from 'src/common/email-config';
import { NotificationForDexEntity } from 'src/entity/notification.entity';
import { HttpService } from '@nestjs/axios';
import { Utils } from 'src/common/utils';

@Injectable()
export class RedemptionRequestService {
  private readonly logger = new Logger(RedemptionRequestService.name);
  constructor(
    private readonly dataService: IDataServices,
    private readonly redemptionRequestBuilderService: RedemptionRequestBuilderService,
    @InjectConnection() private readonly connection: mongoose.Connection,
    private readonly socketGatway: SocketGateway,
    private readonly emailService: EmailService,
    private readonly http: HttpService,
  ) {}

  async getListRedemptionRequest(
    user: any,
    filter: FilterRedemptionRequestDto,
  ) {
    const query: any = {};

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
        $addFields: { sizeOfItem: { $size: '$items' } },
      },
      {
        $lookup: {
          from: 'Fractor',
          let: { fractorId: '$createdBy' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$fractorId', '$$fractorId'] },
              },
            },
            { $project: { fractorId: 1, fullname: 1 } },
          ],
          as: 'Fractor',
        },
      },
      {
        $lookup: {
          from: 'User',
          let: { userId: '$createdBy' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$userId', '$$userId'] },
              },
            },
            { $project: { userId: 1, walletAddress: 1, role: 1 } },
          ],
          as: 'User',
        },
      },
      {
        $addFields: {
          idCreatedBy: '$createdBy',
          createdBy: {
            $cond: {
              if: { $size: '$Fractor' },
              then: { $arrayElemAt: ['$Fractor', 0] },
              else: { $arrayElemAt: ['$User', 0] },
            },
          },
        },
      },
      {
        $unwind: '$items',
      },
      {
        $lookup: {
          from: 'Asset',
          let: { items: '$items' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$itemId', '$$items'] },
              },
            },
            { $project: { _id: 1, name: 1, media: 1, itemId: 1 } },
          ],
          as: 'items',
        },
      },
      {
        $group: {
          _id: '$_id',
          requestId: { $first: '$requestId' },
          status: { $first: '$status' },
          items: { $push: { $arrayElemAt: ['$items', 0] } },
          sizeOfItem: { $first: '$sizeOfItem' },
          idCreatedBy: { $first: '$idCreatedBy' },
          createdBy: { $first: '$createdBy' },
          createdAt: { $first: '$createdAt' },
        },
      },
    );

    const where = {};

    if (filter.name) {
      where['$or'] = [
        { requestId: { $regex: filter.name.trim(), $options: 'i' } },
        { idCreatedBy: { $regex: filter.name.trim(), $options: 'i' } },
        { 'items.name': { $regex: filter.name.trim(), $options: 'i' } },
      ];
    }

    if (Object.keys(where).length > 0) {
      agg.push({ $match: where });
    }

    let sort: any = { $sort: {} };
    if (filter.sortField && filter.sortType) {
      sort['$sort'][filter.sortField] = filter.sortType;
      if (filter.sortField !== 'createdAt') sort['$sort']['createdAt'] = -1;
    } else {
      sort = { $sort: { createdAt: -1 } };
    }

    const dataReturnFilter = [
      sort,
      { $skip: filter.offset || DEFAULT_OFFET },
      { $limit: filter.limit || DEFAULT_LIMIT },
    ];

    agg.push({
      $facet: {
        count: [{ $count: 'count' }],
        data: dataReturnFilter,
      },
    });

    const dataQuery = await this.dataService.redemptionRequest.aggregate(agg, {
      collation: { locale: 'en' },
    });

    const data = get(dataQuery, [0, 'data']);
    const count = get(dataQuery, [0, 'count', 0, 'count']) || 0;

    return {
      totalDocs: count,
      docs: data || [],
    } as ListDocument;
  }

  async getDetail(user: any, requestId: string) {
    const dataQuery = await this.dataService.redemptionRequest.aggregate(
      [
        {
          $match: { requestId },
        },
        {
          $lookup: {
            from: 'Fractor',
            localField: 'createdBy',
            foreignField: 'fractorId',
            as: 'Fractor',
          },
        },
        {
          $lookup: {
            from: 'User',
            localField: 'createdBy',
            foreignField: 'userId',
            as: 'User',
          },
        },
        {
          $lookup: {
            from: 'Admin',
            localField: 'reviewedBy',
            foreignField: 'adminId',
            as: 'Admin',
          },
        },
        {
          $unwind: '$items',
        },
        {
          $lookup: {
            from: 'Asset',
            let: { items: '$items' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$itemId', '$$items'] },
                },
              },
              { $project: { _id: 1, name: 1, media: 1, itemId: 1, status: 1 } },
            ],
            as: 'assetItem',
          },
        },
        {
          $lookup: {
            from: 'Nft',
            let: { items: '$items' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$assetId', '$$items'] },
                },
              },
              {
                $project: {
                  _id: 0,
                  name: 1,
                  mediaUrl: 1,
                  tokenId: 1,
                  status: 1,
                },
              },
            ],
            as: 'nftItem',
          },
        },
        {
          $group: {
            _id: '$_id',
            requestId: { $first: '$requestId' },
            status: { $first: '$status' },
            recipientName: { $first: '$recipientName' },
            contactEmail: { $first: '$contactEmail' },
            receiptAddress: { $first: '$receiptAddress' },
            contactPhone: { $first: '$contactPhone' },
            note: { $first: '$note' },
            reviewComment: { $first: '$reviewComment' },
            createdAt: { $first: '$createdAt' },
            updatedAt: { $first: '$updatedAt' },
            sizeOfItem: { $first: '$sizeOfItem' },
            Fractor: { $first: '$Fractor' },
            User: { $first: '$User' },
            Admin: { $first: '$Admin' },
            items: {
              $push: {
                _id: { $arrayElemAt: ['$assetItem._id', 0] },
                name: { $arrayElemAt: ['$assetItem.name', 0] },
                media: { $arrayElemAt: ['$assetItem.media', 0] },
                itemId: { $arrayElemAt: ['$assetItem.itemId', 0] },
                status: { $arrayElemAt: ['$assetItem.status', 0] },
                nftName: { $arrayElemAt: ['$nftItem.name', 0] },
                nftMediaUrl: { $arrayElemAt: ['$nftItem.mediaUrl', 0] },
                tokenId: { $arrayElemAt: ['$nftItem.tokenId', 0] },
                nftStatus: { $arrayElemAt: ['$nftItem.status', 0] },
              },
            },
          },
        },
      ],
      {
        collation: { locale: 'en' },
      },
    );

    if (!dataQuery.length)
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'id not already exists');

    return await this.redemptionRequestBuilderService.convertDetail(
      dataQuery[0],
    );
  }

  async changeStatus(user: any, requestId: string, data: ChangeStatusDto) {
    const currentRequest = await this.dataService.redemptionRequest.findOne({
      requestId,
    });
    if (!currentRequest)
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'requestId not already exists');

    if (currentRequest.status !== REDEMPTION_REQUEST_STATUS.IN_REVIEW)
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'status invalid');

    if (data.type === REDEMPTION_REQUEST_TYPE.REJECT && !data.reviewComment)
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'comment not exists');

    const listOwnedNfts = await this.dataService.nft.findMany({
      assetId: {
        $in: currentRequest.items,
      },
    });
    const dataUpdate =
      await this.redemptionRequestBuilderService.updateRedemptionRequest(
        data,
        user.adminId,
      );
    let requestCreator;

    let updatedRedemptionRequest;
    let createdByFractor = true;
    let isSucceed = true;
    let notification;
    const session = await this.connection.startSession();
    await session.withTransaction(async () => {
      try {
        updatedRedemptionRequest =
          await this.dataService.redemptionRequest.findOneAndUpdate(
            {
              requestId,
              status: REDEMPTION_REQUEST_STATUS.IN_REVIEW,
              updatedAt: currentRequest['updatedAt'],
            },
            dataUpdate,
            { session, new: true },
          );
        if (currentRequest.createdBy.includes(PREFIX_ID.FRACTOR)) {
          if (data.type === REDEMPTION_REQUEST_TYPE.REJECT)
            await this.dataService.asset.updateMany(
              {
                itemId: {
                  $in: currentRequest.items,
                },
                category: CategoryType.PHYSICAL,
              },
              {
                $set: {
                  'custodianship.status':
                    CUSTODIANSHIP_STATUS.AVAILABLE_FOR_FRACTOR_TO_REDEEM,
                },
              },
              { session },
            );
          else
            await this.dataService.asset.updateMany(
              {
                itemId: {
                  $in: currentRequest.items,
                },
                category: CategoryType.PHYSICAL,
              },
              {
                $set: {
                  'custodianship.status': CUSTODIANSHIP_STATUS.FRAC_TO_FRACTOR,
                },
              },
              { session },
            );
        }

        if (currentRequest.createdBy.includes(PREFIX_ID.USER)) {
          createdByFractor = false;
          await this.dataService.nft.updateMany(
            {
              tokenId: listOwnedNfts.map((nft) => nft.tokenId),
            },
            {
              $set: {
                status:
                  data.type === REDEMPTION_REQUEST_TYPE.APPROVE
                    ? NFT_STATUS.PROCESSING
                    : NFT_STATUS.OWNED,
              },
            },
            { session },
          );
          await this.dataService.asset.updateMany(
            {
              itemId: {
                $in: currentRequest.items,
              },
            },
            {
              'custodianship.status':
                data.type === REDEMPTION_REQUEST_TYPE.APPROVE
                  ? CUSTODIANSHIP_STATUS.FRAC_TO_USER
                  : CUSTODIANSHIP_STATUS.AVAILABLE_FOR_USER_TO_REDEEM,
            },
            { session },
          );
        }
        // handle push notifications
        requestCreator = createdByFractor
          ? ((await this.dataService.fractor.findOne({
              fractorId: currentRequest.createdBy,
            })) as any)
          : ((await this.dataService.user.findOne({
              userId: currentRequest.createdBy,
            })) as any);

        if (
          requestCreator?.notificationSettings?.assetRedemptionRequest ||
          requestCreator?.notificationSettings?.assetRedemptionResult
        ) {
          notification = await this._pushNotiRedemptionRequest(
            requestCreator,
            createdByFractor,
            data.type,
            requestId,
            session,
          );
        }
      } catch (error) {
        isSucceed = false;
        throw error;
      }
    });
    session.endSession();
    if (
      (requestCreator?.notificationSettings.assetRedemptionRequest ||
        requestCreator?.notificationSettings?.assetRedemptionResult) &&
      isSucceed
    ) {
      if (createdByFractor) {
        this.socketGatway.sendNotification(
          SOCKET_NAMESPACE.FRACTOR_ASSET_REDEMPTION_REQUEST_REVIEW_RESULT,
          `${SOCKET_NOTIFICATION_EVENT.CHANGE_STATUS_REDEMPTION_REQUEST_EVENT}_${requestCreator.fractorId}`,
          notification,
        );
        await this._sendMailChangeStatusRequest(
          requestCreator,
          'fractor',
          data.type,
          requestId,
        );
      } else {
        this.socketGatway.sendNotification(
          SOCKET_NAMESPACE.TRADER_ASSET_REDEMPTION_REQUEST_REVIEW_RESULT,
          `${SOCKET_NOTIFICATION_EVENT.CHANGE_STATUS_REDEMPTION_REQUEST_EVENT}_${requestCreator.walletAddress}`,
          notification,
        );
        await this._sendMailChangeStatusRequest(
          requestCreator,
          'trader',
          data.type,
          requestId,
        );
      }
    }

    return updatedRedemptionRequest;
  }

  async confirmRequest(user: any, requestId: string) {
    const currentRequest = await this.dataService.redemptionRequest.findOne({
      requestId,
    });
    if (!currentRequest)
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'requestId not already exists');

    if (currentRequest.status !== REDEMPTION_REQUEST_STATUS.PROCESSING)
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'status invalid');

    const session = await this.connection.startSession();
    session.startTransaction();

    const listOwnedNfts = await this.dataService.nft.findMany({
      assetId: {
        $in: currentRequest.items,
      },
    });

    try {
      const updatedRequest = await this.dataService.redemptionRequest.updateOne(
        {
          requestId,
          status: REDEMPTION_REQUEST_STATUS.PROCESSING,
          updatedAt: currentRequest['updatedAt'],
        },
        {
          status: REDEMPTION_REQUEST_STATUS.REDEEMED,
        },
        { session },
      );
      if (updatedRequest.modifiedCount === 0)
        throw ApiError(
          ErrorCode.DEFAULT_ERROR,
          'Cannot confirm redemption request',
        );

      // update asset status
      const updateAsset = await this.dataService.asset.updateMany(
        {
          itemId: currentRequest.items,
          deleted: false,
        },
        {
          status: ASSET_STATUS.REDEEMED,
        },
        { session },
      );
      if (updateAsset.modifiedCount === 0)
        throw ApiError(ErrorCode.DEFAULT_ERROR, 'Cannot update asset status');

      const updatedNfts = await this.dataService.nft.updateMany(
        {
          tokenId: {
            $in: listOwnedNfts.map((nft) => nft.tokenId),
          },
        },
        {
          $set: {
            status: NFT_STATUS.REDEEMED,
          },
        },
        { session },
      );
      if (updatedNfts.modifiedCount === 0)
        throw ApiError(ErrorCode.DEFAULT_ERROR, 'Cannot update NFT status');

      if (currentRequest.createdBy.includes(PREFIX_ID.FRACTOR)) {
        await this.dataService.asset.updateMany(
          {
            itemId: {
              $in: currentRequest.items,
            },
            category: CategoryType.PHYSICAL,
          },
          {
            $set: {
              'custodianship.status': CUSTODIANSHIP_STATUS.FRACTOR,
            },
          },
          { session },
        );
      } else {
        await this.dataService.asset.updateMany(
          {
            itemId: {
              $in: currentRequest.items,
            },
          },
          {
            $set: {
              'custodianship.status': CUSTODIANSHIP_STATUS.USER,
            },
          },
          { session },
        );
      }

      await session.commitTransaction();
      return { success: true };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async update(id: string, user: any, updateCommentDto: UpdateCommentDto) {
    const currentRedemptionRequest =
      await this.dataService.redemptionRequest.findOne({ requestId: id });

    if (currentRedemptionRequest.status === REDEMPTION_REQUEST_STATUS.IN_REVIEW)
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'status invalid');

    return await this.dataService.redemptionRequest.findOneAndUpdate(
      {
        requestId: id,
        status: { $ne: REDEMPTION_REQUEST_STATUS.IN_REVIEW },
        updatedAt: currentRedemptionRequest['updatedAt'],
      },
      {
        reviewComment: updateCommentDto.reviewComment,
        reviewedBy: user.adminId,
      },
      { new: true },
    );
  }

  async _pushNotiRedemptionRequest(
    receiver: any,
    createdByFractor: boolean,
    type: number,
    requestId: string,
    session,
  ) {
    const subtype =
      type === REDEMPTION_REQUEST_TYPE.APPROVE
        ? NOTIFICATION_SUBTYPE.REDEMPTION_REQUEST_APPROVAL
        : NOTIFICATION_SUBTYPE.REDEMPTION_REQUEST_REJECT;

    const payload = {
      type: NOTIFICATION_TYPE.SYSTEM_MESSAGES,
      receiver: createdByFractor ? receiver.fractorId : receiver.userId,
      subtype: subtype,
      read: false,
      extraData: { redempId: requestId },
      deleted: false,
      hided: false,
      dexId: null,
    };
    const notification = await this.dataService.notification.create(
      payload,
      session,
    );
    // if redemption request create by Traders then push noti to DEX
    if (!createdByFractor) {
      const notificationForDex: NotificationForDexEntity =
        this._createSystemNotificationForDex(
          receiver.walletAddress,
          notification[0]._id.toString(),
          notification[0].subtype,
          notification[0].extraData,
        );
      try {
        const res = await this.http.axiosRef.post(
          `${process.env.SPOT_DEX_DOMAIN}/api/v1/iao/notification`,
          { data: [notificationForDex] },
          {
            headers: { 'api-key': `${process.env.SPOT_DEX_API_KEY}` },
          },
        );
        if (res.data) this.logger.log(`Send notification to Dex successfully`);
      } catch (error) {
        this.logger.error(
          `Error push notification when push notification in DEX ${error}`,
        );
      }
    }
    return notification[0];
  }

  /**
   * Send mail when redemption request changed status
   * @param receiver: user or fractor receive mail
   * @param template: template mail user to send
   * @param type: type of change status request: approve or reject
   * @param requestId: id of the redemption request
   * */
  async _sendMailChangeStatusRequest(
    receiver: any,
    template: string,
    type: number,
    requestId: string,
  ) {
    if (!receiver?.email) return;
    const localizeUrl = Utils.getPathUrlLocalize(receiver?.localization);
    let title;
    let dirName;

    if (type === REDEMPTION_REQUEST_TYPE.APPROVE) {
      title = EMAIL_CONFIG.TITLE.REDEMPTION_REQUEST_APPROVED;
      dirName = EMAIL_CONFIG.DIR.REDEMPTION_REQUEST_APPROVED;
    } else if (type === REDEMPTION_REQUEST_TYPE.REJECT) {
      title = EMAIL_CONFIG.TITLE.REDEMPTION_REQUEST_REJECTED;
      dirName = EMAIL_CONFIG.DIR.REDEMPTION_REQUEST_REJECTED;
    }

    const { titleMail, templateOfMail } = this._getMailLocalize(
      receiver.localization,
      template,
      title,
    );
    let linkDetail = `${process.env.TRADER_DOMAIN}/${localizeUrl}asset-redemption?requestId=${requestId}`;
    if (template === 'fractor') {
      linkDetail = `${process.env.FRACTOR_DOMAIN}/${localizeUrl}asset-redemption?requestId=${requestId}`;
    }
    const mail = new Mail(
      EMAIL_CONFIG.FROM_EMAIL,
      receiver.email,
      titleMail,
      {
        requestId: requestId,
        linkDetail: linkDetail,
        localization: localizeUrl,
      },
      dirName,
      templateOfMail,
      EMAIL_CONFIG.MAIL_REPLY_TO,
    );
    await this.emailService.sendMailFrac(mail);
  }

  /**
   * Function _getMailLocalize: get template & title by localization of request creator
   * @param localization : localization of request creator
   * @param template : template of request creator by localization
   * @param title : title of request creator by localization
   * @returns : template & title of request creator by localization
   */
  private _getMailLocalize(localization: string, template: string, title: any) {
    let titleMail = title.EN;
    let templateOfMail = `${template}_${LOCALIZATION.EN}`;
    switch (localization) {
      case LOCALIZATION.EN:
        titleMail = title.EN;
        templateOfMail = `${template}_${LOCALIZATION.EN}`;
        break;
      case LOCALIZATION.CN:
        titleMail = title.CN;
        templateOfMail = `${template}_${LOCALIZATION.CN}`;
        break;
      case LOCALIZATION.JP:
        titleMail = title.JA;
        templateOfMail = `${template}_${LOCALIZATION.JP}`;
        break;
      case LOCALIZATION.VN:
        titleMail = title.VI;
        templateOfMail = `${template}_${LOCALIZATION.VN}`;
        break;
    }
    return { titleMail, templateOfMail };
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
}
