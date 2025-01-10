import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { ethers } from 'ethers';
import { get } from 'lodash';
import mongoose from 'mongoose';
import { ApiError } from 'src/common/api';
import {
  CVS_NAME,
  DEFAULT_LIMIT,
  DEFAULT_OFFET,
  ErrorCode,
  LOCALIZATION,
} from 'src/common/constants';
import { Utils } from 'src/common/utils';
import { IDataServices } from 'src/core/abstracts/data-services.abstract';
import {
  F_NFT_STATUS,
  IAOEvent,
  IAO_EVENT_STAGE,
  IAO_EVENT_STATUS,
  IAO_REQUEST_STATUS,
  ON_CHAIN_STATUS,
  VAULT_TYPE,
  IAO_EVENT_CALENDER,
  F_NFT_TYPE,
  ASSET_STATUS,
  NOTIFICATION_SUBTYPE,
} from 'src/datalayer/model';
import { ListDocument } from '../iao-request/iao-request.service';
import { CheckTimeDTO } from './dto/check-time.dto';
import { CreateIaoEventDto } from './dto/create-iao-event.dto';
import { GetListIaoEventDto } from './dto/get-list-iao-event.dto';
import { UpdateIaoEventDto } from './dto/update-iao-event.dto';
import {
  CreateWhitelistDto,
  DeleteWhitelistDto,
  ExportWhitelistDto,
  FilterWhitelistDto,
} from './dto/whitelist.dto';
import { IaoEventBuilderService } from './iao-event.factory.service';
import { S3Service } from 'src/s3/s3.service';
const XLSX = require('xlsx');
import moment = require('moment');
import { CalenderDTO } from './dto/calendar.dto';
import { IaoRequestBuilderService } from '../iao-request/iao-request.factory.service';
import { SocketGateway } from 'src/providers/socket/socket.gateway';
import { MailService } from 'src/services/mail/mail.service';
import {
  SOCKET_NAMESPACE,
  SOCKET_NOTIFICATION_EVENT,
} from 'src/providers/socket/socket.enum';
import { EMAIL_CONFIG } from 'src/common/email-config';
import { EmailService } from 'src/services/email/email.service';
import { CommonService } from 'src/common-service/common.service';

@Injectable()
export class IaoEventService {
  private readonly logger = new Logger(IaoEventService.name);

  constructor(
    private readonly dataService: IDataServices,
    private readonly iaoEventBuilderService: IaoEventBuilderService,
    private readonly s3Service: S3Service,
    private readonly iaoRequestBuilderService: IaoRequestBuilderService,
    private readonly socketGateway: SocketGateway,
    private readonly mailService: MailService,
    private readonly emailService: EmailService,
    private readonly commonService: CommonService,
    @InjectConnection() private readonly connection: mongoose.Connection,
  ) {}

  async createDraft(
    createIaoEventDto: CreateIaoEventDto,
    user: any,
  ): Promise<IAOEvent> {
    const error = {};
    // validate whitelistAnnouncementTime
    const date = createIaoEventDto.participationStartTime.toString();
    const participationEndTime = new Date(date);
    participationEndTime.setDate(
      participationEndTime.getDate() + createIaoEventDto.iaoEventDuration,
    );
    // createIaoEventDto['participationEndTime'] = participationEndTime;
    // if (createIaoEventDto.whitelistAnnouncementTime > participationEndTime)
    //   error['whitelistAnnouncementTime'] =
    //     "Whitelist announcement time can't be earlier than Reference participation end time";

    const fnft = await this.dataService.fnft.findOne({
      contractAddress: createIaoEventDto.FNFTcontractAddress,
      status: F_NFT_STATUS.ACTIVE,
    });
    if (!fnft)
      error['FNFTcontractAddress'] = 'F-NFT contractAddress is invalid';

    const iaoEvent = await this.dataService.iaoEvent.findOne({
      FNFTcontractAddress: createIaoEventDto.FNFTcontractAddress,
      status: IAO_EVENT_STATUS.ACTIVE,
      isDeleted: false,
    });
    if (iaoEvent)
      error['FNFTcontractAddress'] =
        'This F-NFT has been selected for another IAO event';

    const existsIAOEvent = await this.checkIaoEventName(createIaoEventDto);

    if (existsIAOEvent)
      error['iaoEventName'] =
        'IAO event name has existed. Please enter another value.';

    try {
      const acceptedCurrencyAddress =
        await this.dataService.exchangeRate.findOne({
          contractAddress: Utils.queryInsensitive(
            createIaoEventDto.acceptedCurrencyAddress,
          ),
        });
      console.log('acceptedCurrencyAddress', acceptedCurrencyAddress);
      
      if (acceptedCurrencyAddress) {
        createIaoEventDto['currencySymbol'] = acceptedCurrencyAddress.symbol;
        createIaoEventDto['currencyDecimal'] = acceptedCurrencyAddress.decimal;
      } else {
        const { currencySymbol, currencyDecimal } =
          await Utils.getCurrencySymbol(
            createIaoEventDto.acceptedCurrencyAddress,
          );
        const data = await Utils.getCurrentPriceFromContract(
          createIaoEventDto.acceptedCurrencyAddress,
        );
        const exchangeRateUsd =
          data[createIaoEventDto.acceptedCurrencyAddress.toLowerCase()]?.usd ??
          process.env.NODE_ENV === 'dev'
            ? 1
            : 0;

        const acceptedContract = await this.dataService.exchangeRate.create({
          contractAddress: createIaoEventDto.acceptedCurrencyAddress
            .trim()
            .toLowerCase(),
          symbol: currencySymbol,
          decimal: +currencyDecimal,
          exchangeRate: exchangeRateUsd,
          stringExchangeRate: Utils.convertNumberToNoExponents(exchangeRateUsd),
        });
        console.log('acceptedContract', acceptedContract);
        createIaoEventDto['currencySymbol'] = currencySymbol;
        createIaoEventDto['currencyDecimal'] = +currencyDecimal;
      }
    } catch (err) {
      this.logger.debug(err);
      error['acceptedCurrencyAddress'] =
        'Token information obtaining request was unsuccessful due to a network error on chain. Please try again';
    }

    if (Object.keys(error).length > 0) throw ApiError('', '', error);

    createIaoEventDto['totalSupply'] = fnft.totalSupply;
    createIaoEventDto['availableSupply'] = fnft.totalSupply;
    createIaoEventDto['tokenSymbol'] = fnft.tokenSymbol;
    createIaoEventDto['iaoRequestId'] = fnft.iaoRequestId;

    const session = await this.connection.startSession();
    session.startTransaction();

    let items = [];
    let iaoRequest;
    if (fnft.fnftType === F_NFT_TYPE.AUTO_IMPORT) {
      iaoRequest = await this.dataService.iaoRequest.findOne({
        iaoId: fnft.iaoRequestId,
      });
      items = iaoRequest.items;
    }

    try {
      const buildIAOEvent = await this.iaoEventBuilderService.createIAOEvent(
        createIaoEventDto,
        user,
        iaoRequest?.ownerId,
        session,
      );

      const iaoEvent = await this.dataService.iaoEvent.create(buildIAOEvent, {
        session: session,
      });

      if (fnft.fnftType === F_NFT_TYPE.AUTO_IMPORT) {
        await this.dataService.asset.updateMany(
          { itemId: { $in: items } },
          { $set: { status: ASSET_STATUS.IAO_EVENT } },
          { session },
        );
        await this.dataService.iaoRequest.updateOne(
          { iaoId: fnft.iaoRequestId },
          { $set: { iaoEventId: iaoEvent[0].iaoEventId } },
          { session },
        );
        const fractor = await this.dataService.fractor.findOne({
          fractorId: iaoRequest.ownerId,
        });
        if (
          iaoEvent[0].isDisplay &&
          fractor.notificationSettings?.iaoRequestResult
        ) {
          await this.notificationIAOEvent(
            iaoRequest,
            SOCKET_NOTIFICATION_EVENT.ADMIN_CREATE_IAO_EVENT,
            NOTIFICATION_SUBTYPE.CREATE_IAO_EVENT_PUBLIC,
            iaoEvent[0].iaoEventId,
            fractor,
          );
        }
      }

      // create whitelist
      if (!iaoEvent[0].allowWhitelist) {
        await this.dataService.whitelist.create({
          iaoEventId: iaoEvent[0].iaoEventId,
          whiteListAddresses: [],
          deleted: false,
        });
      }

      await session.commitTransaction();

      return iaoEvent[0];
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async notificationIAOEvent(
    iaoRequest,
    event,
    subtype,
    iaoEventId,
    fractor,
    session?,
  ) {
    // notification
    let notification: any = await this.dataService.notification.create(
      this.iaoRequestBuilderService.createNotification(
        iaoRequest.ownerId,
        iaoRequest['_id'],
        iaoRequest.iaoId,
        subtype,
        iaoEventId,
      ),
      { session },
    );
    notification = notification[0];
    // socket
    this.socketGateway.sendNotification(
      SOCKET_NAMESPACE.IAO_REQUEST_REVIEW_RESULT,
      `${event}_${iaoRequest.ownerId}`,
      notification,
    );
    // send mail
    if (fractor.email) {
      const data = this.createTemplateMail(iaoEventId, iaoRequest, fractor);
      await this.emailService.addQueue(data);
    }
  }

  createTemplateMail(iaoEventId, iaoRequest, fractor) {
    let template = EMAIL_CONFIG.DIR.CREATE_IAO_EVENT_PUBLIC.EN;
    let subject = EMAIL_CONFIG.TITLE.CREATE_IAO_EVENT_PUBLIC.EN;
    const eventDetailUrl = `${process.env.TRADER_DOMAIN}/${fractor.localization}/iao-event/${iaoEventId}`;
    const iaoRequestDetailUrl = `${process.env.FRACTOR_DOMAIN}/${fractor.localization}/request-iao/${iaoRequest['_id']}`;

    if (fractor.localization === LOCALIZATION.CN) {
      template = EMAIL_CONFIG.DIR.CREATE_IAO_EVENT_PUBLIC.CN;
      subject = EMAIL_CONFIG.TITLE.CREATE_IAO_EVENT_PUBLIC.CN;
    }
    if (fractor.localization === LOCALIZATION.JP) {
      template = EMAIL_CONFIG.DIR.CREATE_IAO_EVENT_PUBLIC.JA;
      subject = EMAIL_CONFIG.TITLE.CREATE_IAO_EVENT_PUBLIC.JP;
    }
    if (fractor.localization === LOCALIZATION.VN) {
      template = EMAIL_CONFIG.DIR.CREATE_IAO_EVENT_PUBLIC.VI;
      subject = EMAIL_CONFIG.TITLE.CREATE_IAO_EVENT_PUBLIC.VN;
    }
    return {
      to: fractor.email,
      from: { name: EMAIL_CONFIG.FROM_EMAIL, address: process.env.MAIL_FROM },
      subject: subject,
      template,
      context: {
        iaoRequestId: iaoRequest.iaoId,
        eventDetailUrl,
        iaoRequestDetailUrl,
        contactUs: `${process.env.FRACTOR_DOMAIN}/${fractor.localization}/contact-us`,
        localization: fractor.localization,
      },
    };
  }

  async findAll(filter: GetListIaoEventDto) {
    const query = { isDeleted: false };
    const dateQuery = [];
    if (filter.eventStt) {
      query['onChainStatus'] = filter.eventStt;
    }
    if (filter.keyword) {
      query['$or'] = [
        {
          'iaoEventName.en': {
            $regex: Utils.escapeRegex(filter.keyword.trim()),
            $options: 'i',
          },
        },
        {
          iaoEventId: {
            $regex: Utils.escapeRegex(filter.keyword.trim()),
            $options: 'i',
          },
        },
        {
          tokenSymbol: {
            $regex: Utils.escapeRegex(filter.keyword.trim()),
            $options: 'i',
          },
        },
        {
          FNFTcontractAddress: {
            $regex: Utils.escapeRegex(filter.keyword.trim()),
            $options: 'i',
          },
        },
      ];
    }
    if (filter.stage === IAO_EVENT_STAGE.UPCOMING) {
      dateQuery.push({
        registrationStartTime: {
          $gte: new Date(),
        },
      });
    }
    if (filter.stage === IAO_EVENT_STAGE.REGISTER_NOW) {
      dateQuery.push(
        {
          registrationStartTime: {
            $lte: new Date(),
          },
        },
        {
          registrationEndTime: {
            $gte: new Date(),
          },
        },
      );
    }
    if (filter.stage === IAO_EVENT_STAGE.ON_SALE_SOON) {
      dateQuery.push(
        {
          registrationEndTime: {
            $lte: new Date(),
          },
        },
        {
          participationStartTime: {
            $gte: new Date(),
          },
        },
      );
    }
    if (filter.stage === IAO_EVENT_STAGE.ON_SALE) {
      dateQuery.push(
        {
          participationStartTime: {
            $lte: new Date(),
          },
        },
        {
          participationEndTime: {
            $gte: new Date(),
          },
        },
      );
    }
    if (filter.stage === IAO_EVENT_STAGE.COMPLETED) {
      dateQuery.push({
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
      });
    }

    if (filter.stage === IAO_EVENT_STAGE.FAILED) {
      dateQuery.push({
        $and: [
          {
            participationEndTime: {
              $lte: new Date(),
            },
            vaultType: VAULT_TYPE.VAULT,
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
      });
    }
    if (filter.registrationFromDate) {
      dateQuery.push({
        registrationStartTime: {
          $gte: new Date(filter.registrationFromDate),
        },
      });
    }
    if (filter.registrationToDate) {
      dateQuery.push({
        registrationEndTime: {
          $lte: new Date(filter.registrationToDate),
        },
      });
    }
    if (filter.particicationFromDate) {
      dateQuery.push({
        participationStartTime: {
          $gte: new Date(filter.particicationFromDate),
        },
      });
    }
    if (filter.particicationToDate) {
      dateQuery.push({
        participationEndTime: {
          $lte: new Date(filter.particicationToDate),
        },
      });
    }
    if (dateQuery.length) query['$and'] = dateQuery;
    const agg = [];
    agg.push(
      {
        $match: {
          isDeleted: false,
        },
      },
      {
        $lookup: {
          from: 'Fnft',
          localField: 'FNFTcontractAddress',
          foreignField: 'contractAddress',
          as: 'fnft',
        },
      },
      {
        $unwind: '$fnft',
      },
      {
        $project: {
          iaoEventId: '$iaoEventId',
          createdAt: '$createdAt',
          iaoEventName: '$iaoEventName',
          vaultType: '$vaultType',
          registrationStartTime: '$registrationStartTime',
          registrationEndTime: '$registrationEndTime',
          participationStartTime: '$participationStartTime',
          participationEndTime: '$participationEndTime',
          onChainStatus: '$onChainStatus',
          status: '$status',
          FNFTcontractAddress: '$FNFTcontractAddress',
          totalSupply: '$totalSupply',
          availableSupply: '$availableSupply',
          tokenSymbol: '$tokenSymbol',
          vaultUnlockThreshold: '$vaultUnlockThreshold',
          eventPhotoUrl: '$eventPhotoUrl',
          eventBannerUrl: '$eventBannerUrl',
          isDeleted: '$isDeleted',
          fnftId: '$fnft.fnftId',
        },
      },
      {
        $match: query,
      },
    );

    let sort: any = { $sort: {} };
    if (filter.sortField && filter.sortType) {
      sort['$sort'][filter.sortField] = filter.sortType;
    } else {
      sort = { $sort: { createdAt: -1 } };
    }
    const dataReturnFilter = [sort, { $skip: filter.offset || 0 }];
    agg.push({
      $facet: {
        count: [{ $count: 'count' }],
        data: dataReturnFilter,
      },
    });
    if (filter.limit !== -1)
      dataReturnFilter.push({ $limit: filter.limit || 10 });
    const dataQuery = await this.dataService.iaoEvent.aggregate(agg, {
      collation: { locale: 'en' },
    });
    const data = get(dataQuery, [0, 'data']);
    const count = get(dataQuery, [0, 'count', 0, 'count']) || 0;

    const finalData = data.map((iaoEvent) => ({
      ...iaoEvent,
      stage: this.checkCurrentStage(
        iaoEvent.registrationStartTime,
        iaoEvent.registrationEndTime,
        iaoEvent.participationStartTime,
        iaoEvent.participationEndTime,
        iaoEvent.vaultType,
        iaoEvent.totalSupply - iaoEvent.availableSupply >=
          (iaoEvent.vaultUnlockThreshold * iaoEvent.totalSupply) / 100,
      ),
    }));

    return {
      totalDocs: count,
      docs: finalData,
    };
  }

  async exportIaoEvent(res: any, filter: GetListIaoEventDto) {
    const query = { isDeleted: false };
    const dateQuery = [];
    if (filter.keyword) {
      query['$or'] = [
        {
          'iaoEventName.en': {
            $regex: Utils.escapeRegex(filter.keyword.trim()),
            $options: 'i',
          },
        },
        {
          iaoEventId: {
            $regex: Utils.escapeRegex(filter.keyword.trim()),
            $options: 'i',
          },
        },
        {
          tokenSymbol: {
            $regex: Utils.escapeRegex(filter.keyword.trim()),
            $options: 'i',
          },
        },
        {
          FNFTcontractAddress: {
            $regex: Utils.escapeRegex(filter.keyword.trim()),
            $options: 'i',
          },
        },
      ];
    }
    if (filter.stage === IAO_EVENT_STAGE.UPCOMING) {
      dateQuery.push({
        registrationStartTime: {
          $gte: new Date(),
        },
      });
    }
    if (filter.stage === IAO_EVENT_STAGE.REGISTER_NOW) {
      dateQuery.push(
        {
          registrationStartTime: {
            $lte: new Date(),
          },
        },
        {
          registrationEndTime: {
            $gte: new Date(),
          },
        },
      );
    }
    if (filter.stage === IAO_EVENT_STAGE.ON_SALE_SOON) {
      dateQuery.push(
        {
          registrationEndTime: {
            $lte: new Date(),
          },
        },
        {
          participationStartTime: {
            $gte: new Date(),
          },
        },
      );
    }
    if (filter.stage === IAO_EVENT_STAGE.ON_SALE) {
      dateQuery.push(
        {
          participationStartTime: {
            $lte: new Date(),
          },
        },
        {
          participationEndTime: {
            $gte: new Date(),
          },
        },
      );
    }
    if (filter.stage === IAO_EVENT_STAGE.COMPLETED) {
      dateQuery.push({
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
      });
    }

    if (filter.stage === IAO_EVENT_STAGE.FAILED) {
      dateQuery.push({
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
      });
    }
    if (filter.registrationFromDate) {
      dateQuery.push({
        registrationStartTime: {
          $gte: new Date(filter.registrationFromDate),
        },
      });
    }
    if (filter.registrationToDate) {
      dateQuery.push({
        registrationEndTime: {
          $lte: new Date(filter.registrationToDate),
        },
      });
    }
    if (filter.particicationFromDate) {
      dateQuery.push({
        participationStartTime: {
          $gte: new Date(filter.particicationFromDate),
        },
      });
    }
    if (filter.particicationToDate) {
      dateQuery.push({
        participationEndTime: {
          $lte: new Date(filter.particicationToDate),
        },
      });
    }
    let sort: any = { $sort: {} };
    if (filter.sortField && filter.sortType) {
      sort['$sort'][filter.sortField] = filter.sortType;
    } else {
      sort = { $sort: { createdAt: -1 } };
    }
    const dataReturnFilter = [sort];
    if (dateQuery.length) query['$and'] = dateQuery;
    const dataQuery = await this.dataService.iaoEvent.aggregate([
      {
        $match: {
          isDeleted: false,
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
        $unwind: {
          path: '$iaoRequest',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'Admin',
          localField: 'createdBy',
          foreignField: 'adminId',
          as: 'createdByAdmin',
        },
      },
      {
        $unwind: {
          path: '$createdByAdmin',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'Admin',
          localField: 'updatedBy',
          foreignField: 'adminId',
          as: 'updatedByAdmin',
        },
      },
      {
        $unwind: {
          path: '$updatedByAdmin',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'Admin',
          localField: 'lastWhitelistUpdatedBy',
          foreignField: 'adminId',
          as: 'lastWhitelistUpdatedByAdmin',
        },
      },
      {
        $unwind: {
          path: '$lastWhitelistUpdatedByAdmin',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'Admin',
          localField: 'createdOnChainBy',
          foreignField: 'adminId',
          as: 'createdOnChainByAdmin',
        },
      },
      {
        $unwind: {
          path: '$createdOnChainByAdmin',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'Asset',
          localField: 'iaoRequest.items',
          foreignField: 'itemId',
          as: 'iaoRequest.items',
        },
      },
      {
        $match: query,
      },
      ...dataReturnFilter,
    ]);
    const assetTypes = await this.dataService.assetTypes.findMany({});
    const finalData = this.iaoEventBuilderService.convertExportedEvents(
      dataQuery,
      assetTypes,
    );
    const headings = [
      [
        'Event ID',
        'Event duration (days)',
        'Registration Start Time (UTC)',
        'Registration End Time (UTC)',
        'Participation Start Time (UTC)',
        'Participation End Time (UTC)',
        'Event Name',
        'Event Type',
        'Chain',
        'F-NFT Contract Address',
        'F-NFT Symbol',
        'F-NFT Total Supply',
        'F-NFT Decimals',
        'IAO Request ID',
        'Currency Contract Address',
        'Currency Symbol',
        'Exchange Rate',
        'Asset Valuation',
        'IAO Offer (%)',
        'IAO Offer (amt)',
        'Vault Unlock Threshold (%)',
        'Vault Unlock Threshold (amt)',
        'Display on Trader Web',
        'Number of items',
        'Asset name',
        'Asset category',
        'Asset type',
        'Allocation Type',
        'Hard cap per user (%)',
        'Hard cap per user (amt)',
        'Whitelist Announcement Time',
        'Created by',
        'Created on',
        'Created on chain by',
        'Created on chain on',
        'Last update by',
        'Last update on',
        'Last Whitelist update by',
        'Last Whitelist update on',
      ],
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(finalData, {
      origin: 'A2',
      skipHeader: true,
      header: [
        'iaoEventId',
        'iaoEventDuration',
        'registrationStartTime',
        'registrationEndTime',
        'participationStartTime',
        'participationEndTime',
        'iaoEventName',
        'vaultType',
        'chainId',
        'FNFTcontractAddress',
        'tokenSymbol',
        'totalSupply',
        'fNftDecimals',
        'iaoRequestId',
        'acceptedCurrencyAddress',
        'acceptedCurrencySymbol',
        'exchangeRate',
        'assetValuation',
        'IAOOffered',
        'IAOOfferedToken',
        'vaultUnlockThreshold',
        'vaultUnlockThresholdToken',
        'display',
        'numberOfItems',
        'assetName',
        'assetCategory',
        'assetType',
        'allocationType',
        'hardCapPerUser',
        'hardCapPerUserToken',
        'whitelistAnnouncementTime',
        'createdBy',
        'createdOn',
        'createdOnChainBy',
        'createdOnChainOn',
        'updatedBy',
        'updatedOn',
        'lastWhitelistUpdatedBy',
        'lastWhitelistUpdatedOn',
      ],
    });
    XLSX.utils.sheet_add_aoa(ws, headings, { origin: 'A1' });
    XLSX.utils.book_append_sheet(wb, ws);
    const buffer = XLSX.write(wb, { bookType: 'csv', type: 'buffer' });
    res.attachment(`${CVS_NAME.IAO_EVENT}${moment().format('DDMMYY')}.csv`);

    return res.status(200).send(buffer);
  }

  async findOne(id: string) {
    const iaoEvent = await this.dataService.iaoEvent.findOne({
      iaoEventId: id,
      isDeleted: false,
    });
    if (!iaoEvent) throw ApiError('', 'This IAO event not exists');

    const fnft: any = await this.dataService.fnft.findOne({
      contractAddress: iaoEvent.FNFTcontractAddress,
      deleted: false,
    });

    if (!fnft) throw ApiError('', 'F-NFT of This IAO event not exists');

    const iaoRequest: any = await this.dataService.iaoRequest.findOne({
      iaoId: fnft.iaoRequestId,
      status: IAO_REQUEST_STATUS.APPROVED_B,
    });
    // get NFT
    const nftId = fnft.items.map((i) => {
      return { tokenId: i };
    });
    const nfts = await this.dataService.nft.findMany(
      { $or: nftId },
      { name: 1, tokenId: 1, status: 1, assetId: 1 },
    );
    fnft.items = nfts;
    if (iaoRequest) {
      // get name of fractor
      const fractor = await this.dataService.fractor.findOne(
        {
          fractorId: iaoRequest.ownerId,
        },
        { fullname: 1, assignedBD: 1 },
      );
      iaoRequest.fractor = fractor.fullname;
      // get name of BD
      const bd = await this.dataService.admin.findOne(
        {
          adminId: fractor.assignedBD,
        },
        { fullname: 1 },
      );
      iaoRequest.bd = {
        name: bd?.fullname ? bd.fullname : null,
        id: fractor.assignedBD,
      };
      // get url of items
      const itemsId = iaoRequest.items.map((i) => {
        return { itemId: i };
      });
      const items: any = await this.dataService.asset.findMany(
        {
          $or: itemsId,
        },
        { itemId: 1, name: 1, media: 1, _id: 0 },
      );
      iaoRequest.itemObject = items;
    }
    //other info
    const getCreatedBy = this.dataService.admin.findOne(
      {
        adminId: iaoEvent.createdBy,
      },
      { fullname: 1 },
    );
    const getUpdatedBy = this.dataService.admin.findOne(
      {
        adminId: iaoEvent.updatedBy,
      },
      { fullname: 1 },
    );
    const getLastWhitelistUpdatedBy = this.dataService.admin.findOne(
      {
        adminId: iaoEvent.lastWhitelistUpdatedBy,
      },
      { fullname: 1 },
    );

    const getCreatedOnChainBy = this.dataService.admin.findOne(
      {
        adminId: iaoEvent.createdOnChainBy,
      },
      { fullname: 1 },
    );

    const [createdBy, updatedBy, lastWhitelistUpdatedBy, createdOnChainBy] =
      await Promise.all([
        getCreatedBy,
        getUpdatedBy,
        getLastWhitelistUpdatedBy,
        getCreatedOnChainBy,
      ]);

    const obj = {
      createdBy,
      updatedBy,
      lastWhitelistUpdatedBy,
      createdOnChainBy,
    };

    const currentStage = this.checkCurrentStage(
      iaoEvent.registrationStartTime,
      iaoEvent.registrationEndTime,
      iaoEvent.participationStartTime,
      iaoEvent.participationEndTime,
      iaoEvent.vaultType,
      iaoEvent.totalSupply - iaoEvent.availableSupply >=
        (iaoEvent.vaultUnlockThreshold * iaoEvent.totalSupply) / 100,
    );
    iaoEvent['currentStage'] = currentStage;
    const iaoEventDetail = this.iaoEventBuilderService.getIaoEventDetail(
      iaoEvent,
      fnft,
      iaoRequest,
      obj,
    );

    return iaoEventDetail;
  }

  async updateIaoDraft(
    id: string,
    updateIaoEventDto: UpdateIaoEventDto,
    user: any,
  ) {
    const error = {};
    const iaoEvent = await this.dataService.iaoEvent.findOne({
      iaoEventId: id,
      isDeleted: false,
      onChainStatus: ON_CHAIN_STATUS.DRAFT,
    });
    if (!iaoEvent) throw ApiError('', 'Data not exists');
    const fnft = await this.dataService.fnft.findOne({
      contractAddress: updateIaoEventDto.FNFTcontractAddress,
      status: F_NFT_STATUS.ACTIVE,
    });
    if (!fnft)
      error['FNFTcontractAddress'] = 'F-NFT contractAddress is invalid';

    const checkFnft = await this.dataService.iaoEvent.findOne({
      FNFTcontractAddress: updateIaoEventDto.FNFTcontractAddress,
      status: IAO_EVENT_STATUS.ACTIVE,
      isDeleted: false,
    });
    if (checkFnft && checkFnft.iaoEventId !== id)
      error['FNFTcontractAddress'] =
        'This F-NFT has been selected for another IAO event';

    const existsIAOEvent = await this.checkIaoEventName(updateIaoEventDto);

    if (existsIAOEvent && existsIAOEvent.iaoEventId !== id)
      error['iaoEventName'] =
        'IAO event name has existed. Please enter another value.';
    try {
      const acceptedCurrencyAddress =
        await this.dataService.exchangeRate.findOne({
          contractAddress: Utils.queryInsensitive(
            updateIaoEventDto.acceptedCurrencyAddress,
          ),
        });
      if (acceptedCurrencyAddress) {
        updateIaoEventDto['currencySymbol'] = acceptedCurrencyAddress.symbol;
        updateIaoEventDto['currencyDecimal'] = acceptedCurrencyAddress.decimal;
      } else {
        const { currencySymbol, currencyDecimal } =
          await Utils.getCurrencySymbol(
            updateIaoEventDto.acceptedCurrencyAddress,
          );
        const data = await Utils.getCurrentPriceFromContract(
          updateIaoEventDto.acceptedCurrencyAddress,
        );
        const exchangeRateUsd =
          data[updateIaoEventDto.acceptedCurrencyAddress.toLowerCase()]?.usd ??
          process.env.NODE_ENV === 'dev'
            ? 1
            : 0;

        const acceptedContract = await this.dataService.exchangeRate.create({
          contractAddress: updateIaoEventDto.acceptedCurrencyAddress
            .trim()
            .toLowerCase(),
          symbol: currencySymbol,
          decimal: +currencyDecimal,
          exchangeRate: exchangeRateUsd,
          stringExchangeRate: Utils.convertNumberToNoExponents(exchangeRateUsd),
        });
        updateIaoEventDto['currencySymbol'] = acceptedContract.symbol;
        updateIaoEventDto['currencyDecimal'] = acceptedContract.decimal;
      }
    } catch (err) {
      this.logger.debug(err);
      error['acceptedCurrencyAddress'] =
        'Token information obtaining request was unsuccessful due to a network error on chain. Please try again';
    }

    if (Object.keys(error).length > 0) throw ApiError('', '', error);

    updateIaoEventDto['totalSupply'] = fnft.totalSupply;
    updateIaoEventDto['availableSupply'] = fnft.totalSupply;
    updateIaoEventDto['tokenSymbol'] = fnft.tokenSymbol;
    updateIaoEventDto['iaoRequestId'] = fnft.iaoRequestId;

    const iaoEventToUpdate = this.iaoEventBuilderService.updateIaoEventDetail(
      updateIaoEventDto,
      user,
    );
    await this.dataService.iaoEvent.updateOne(
      {
        iaoEventId: id,
        isDeleted: false,
        onChainStatus: ON_CHAIN_STATUS.DRAFT,
      },
      {
        $set: {
          ...iaoEventToUpdate,
        },
      },
    );
    const iaoRequest = await this.dataService.iaoRequest.findOne({
      iaoId: iaoEvent.iaoRequestId,
    });
    const fractor = await this.dataService.fractor.findOne({
      fractorId: iaoRequest.ownerId,
    });
    if (
      !iaoEvent.isDisplay &&
      updateIaoEventDto.isDisplay &&
      fractor.notificationSettings?.iaoRequestResult
    ) {
      await this.notificationIAOEvent(
        iaoRequest,
        SOCKET_NOTIFICATION_EVENT.ADMIN_CREATE_IAO_EVENT,
        NOTIFICATION_SUBTYPE.CREATE_IAO_EVENT_PUBLIC,
        iaoEvent.iaoEventId,
        fractor,
      );
    }

    return id;
  }

  async updateIaoOnChain(
    id: string,
    updateIaoEventDto: UpdateIaoEventDto,
    user: any,
  ) {
    const error = {};
    const iaoEvent = await this.dataService.iaoEvent.findOne({
      iaoEventId: id,
      isDeleted: false,
      onChainStatus: ON_CHAIN_STATUS.ON_CHAIN,
    });

    if (!iaoEvent) throw ApiError('', 'Data not exists');

    const existsIAOEvent = await this.checkIaoEventName(updateIaoEventDto);

    if (existsIAOEvent && existsIAOEvent.iaoEventId !== id)
      error['iaoEventName'] =
        'IAO event name has existed. Please enter another value.';
    if (Object.keys(error).length > 0) throw ApiError('', '', error);
    const iaoEventToUpdate = this.iaoEventBuilderService.updateIaoOnChain(
      updateIaoEventDto,
      user,
    );
    await this.dataService.iaoEvent.updateOne(
      {
        iaoEventId: id,
        isDeleted: false,
        onChainStatus: ON_CHAIN_STATUS.ON_CHAIN,
      },
      {
        $set: {
          ...iaoEventToUpdate,
        },
      },
    );
    const iaoRequest = await this.dataService.iaoRequest.findOne({
      iaoId: iaoEvent.iaoRequestId,
    });
    const fractor = await this.dataService.fractor.findOne({
      fractorId: iaoRequest.ownerId,
    });
    if (
      !iaoEvent.isDisplay &&
      updateIaoEventDto.isDisplay &&
      fractor.notificationSettings?.iaoRequestResult
    ) {
      await this.notificationIAOEvent(
        iaoRequest,
        SOCKET_NOTIFICATION_EVENT.ADMIN_CREATE_IAO_EVENT,
        NOTIFICATION_SUBTYPE.CREATE_IAO_EVENT_PUBLIC,
        iaoEvent.iaoEventId,
        fractor,
      );
    }
    return id;
  }

  async checkIaoEventName(dto) {
    const query: any = {
      $or: [
        {
          'iaoEventName.en': {
            $regex: Utils.escapeRegex(dto.iaoEventName.en.trim()),
            $options: 'i',
          },
        },
      ],
    };

    if (dto.iaoEventName.cn)
      query['$or'].push({
        'iaoEventName.cn': {
          $regex: Utils.escapeRegex(dto.iaoEventName.en.trim()),
          $options: 'i',
        },
      });

    if (dto.iaoEventName.ja)
      query['$or'].push({
        'iaoEventName.ja': {
          $regex: Utils.escapeRegex(dto.iaoEventName.en.trim()),
          $options: 'i',
        },
      });

    return await this.dataService.iaoEvent.findOne({
      ...query,
      isDeleted: false,
    });
  }

  async remove(id: string, user: any) {
    const iaoEvent = await this.dataService.iaoEvent.findOneAndUpdate(
      {
        iaoEventId: id,
        isDeleted: false,
        onChainStatus: ON_CHAIN_STATUS.DRAFT,
      },
      { isDeleted: true, isDisplay: false, updatedBy: user.adminId },
      { new: true },
    );
    if (!iaoEvent) throw ApiError('', 'iaoEventId is invalid');

    const iaoRequest = await this.dataService.iaoRequest.findOne({
      iaoId: iaoEvent.iaoRequestId,
    });
    if (iaoRequest) {
      await this.dataService.asset.updateMany(
        {
          itemId: { $in: iaoRequest.items },
        },
        { $set: { status: ASSET_STATUS.FRACTIONALIZED } },
      );
    }

    return iaoEvent.iaoEventId;
  }

  async getListWhitelist(user: any, filter: FilterWhitelistDto) {
    const currertWhitelist = await this.dataService.whitelist.findOne({
      iaoEventId: filter.iaoEventId,
      deleted: false,
    });
    if (!currertWhitelist) return { totalDocs: 0, docs: [] } as ListDocument;

    const totalAllAddress = currertWhitelist.whiteListAddresses.length;

    // search data
    const dataRegex = new RegExp(filter.wallet, 'i');
    let whiteListAddresses = currertWhitelist.whiteListAddresses.filter((i) =>
      dataRegex.test(i.walletAddress),
    );

    const totalSearchAddress = whiteListAddresses.length;

    // sort deposited
    if (filter.sortField && filter.sortType) {
      whiteListAddresses = whiteListAddresses.sort((n1, n2) => {
        if (n1[filter.sortField] > n2[filter.sortField]) {
          return filter.sortType;
        }

        if (n1[filter.sortField] < n2[filter.sortField]) {
          return -filter.sortType;
        }

        return 0;
      });
    }

    if (filter.limit !== -1) {
      const offset = filter.offset ? filter.offset : DEFAULT_OFFET;

      const limit = offset + (filter.limit || DEFAULT_LIMIT);

      // offset && limit
      whiteListAddresses = whiteListAddresses.slice(offset, limit);
    }

    return {
      totalDocs: totalSearchAddress,
      metadata: { totalAllDocs: totalAllAddress },
      docs: whiteListAddresses || [],
    } as ListDocument;
  }

  async createWhitelist(user, data: CreateWhitelistDto) {
    if (!data.whitelistAddresses.length)
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'whitelistAddresses is empty');

    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      // check Iao-event
      await this.checkIaoEvent(data.iaoEventId, user, session);

      // set data whitelist
      const whiteListAddresses = await this.checkAddressInWhitelist(data);

      // check iaoEventId in whitelist
      const currentWhitelist = await this.dataService.whitelist.findOne({
        iaoEventId: data.iaoEventId,
        deleted: false,
      });
      let newWhitelist;
      if (currentWhitelist) {
        await this.dataService.whitelist.findOneAndUpdate(
          { _id: currentWhitelist['_id'] },
          { $set: { deleted: true } },
          { session },
        );
        newWhitelist = await this.dataService.whitelist.create(
          {
            iaoEventId: data.iaoEventId,
            whiteListAddresses,
            deleted: false,
          },
          { session },
        );
      } else {
        newWhitelist = await this.dataService.whitelist.create(
          {
            iaoEventId: data.iaoEventId,
            whiteListAddresses,
            deleted: false,
          },
          { session },
        );
      }

      if (!newWhitelist)
        throw ApiError(
          ErrorCode.DEFAULT_ERROR,
          "can't update or create Whitelist",
        );

      await session.commitTransaction();
      return newWhitelist;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async checkIaoEvent(iaoEventId: string, user: any, session: any) {
    const filter = { iaoEventId, isDeleted: false };

    const currentIaoEvent = await this.dataService.iaoEvent.findOne(filter);
    if (!currentIaoEvent)
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'Id not already exists');

    if (currentIaoEvent.participationStartTime.getTime() <= Date.now())
      throw ApiError(
        ErrorCode.DEFAULT_ERROR,
        'Now >= Participation start time',
      );

    const updatedIaoEvent = await this.dataService.iaoEvent.findOneAndUpdate(
      { iaoEventId, isDeleted: false, updatedAt: currentIaoEvent['updatedAt'] },
      {
        $set: {
          lastWhitelistUpdatedAt: Date.now(),
          lastWhitelistUpdatedBy: user.adminId,
        },
      },
      { session },
    );
    if (!updatedIaoEvent)
      throw ApiError(ErrorCode.DEFAULT_ERROR, "can't update iao event");
  }

  async checkAddressInWhitelist(data: CreateWhitelistDto) {
    const whiteListAddresses = [];
    const dataInput: any = [...new Set(data.whitelistAddresses)];

    for (const walletAddress of dataInput) {
      //check incorrect
      if (!ethers.utils.isAddress(walletAddress))
        throw ApiError(ErrorCode.DEFAULT_ERROR, 'Invalid wallet address');

      whiteListAddresses.push({
        walletAddress,
        deposited: 0,
        purchased: 0,
        depositedByFiat: 0
      });
    }

    return whiteListAddresses;
  }

  async removeWhitelist(
    iaoEventId: string,
    user: any,
    data: DeleteWhitelistDto,
  ) {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      // check Iao-event
      await this.checkIaoEvent(iaoEventId, user, session);

      const filter = { iaoEventId, deleted: false };
      const option = {};

      if (data.isClearAll) {
        option['deleted'] = true;
      } else {
        if (!data.walletAddress)
          throw ApiError(
            ErrorCode.DEFAULT_ERROR,
            'walletAddress should not be empty',
          );

        filter['whiteListAddresses.walletAddress'] = data.walletAddress;
        option['$pull'] = {
          whiteListAddresses: { walletAddress: data.walletAddress },
        };
      }

      //delete a record or all
      const updateData = await this.dataService.whitelist.updateOne(
        filter,
        option,
        { session },
      );
      if (updateData.modifiedCount !== 1)
        throw ApiError(ErrorCode.DEFAULT_ERROR, "can't update whitelist");

      await session.commitTransaction();
      return updateData;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async exportWhitelist(res: any, user: any, data: ExportWhitelistDto) {
    const filter = { iaoEventId: data.iaoEventId, isDeleted: false };

    const currentIaoEvent = await this.dataService.iaoEvent.findOne(filter);
    if (!currentIaoEvent)
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'Id not already exists');

    if (currentIaoEvent.whitelistAnnouncementTime.getTime() >= Date.now())
      throw ApiError(
        ErrorCode.DEFAULT_ERROR,
        'Now <= Participation start time',
      );

    const agg = [];

    agg.push({
      $match: { iaoEventId: data.iaoEventId, deleted: false },
    });

    const query: any = {
      $project: {
        iaoEventId: 1,
        deleted: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    };

    if (data.wallet && data.wallet.trim()) {
      query['$project']['whiteListAddresses'] = {
        $filter: {
          input: '$whiteListAddresses',
          as: 'whiteListAddress',
          cond: {
            $regexMatch: {
              input: '$$whiteListAddress.walletAddress',
              regex: data.wallet.trim(),
              options: 'i',
            },
          },
        },
      };
    } else {
      query['$project']['whiteListAddresses'] = 1;
    }

    agg.push(query);

    const dataQuery = await this.dataService.whitelist.aggregate(agg, {
      collation: { locale: 'en' },
    });

    const currentWhiltelist = get(dataQuery, [0]);

    if (!currentWhiltelist)
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'iaoEventId already exists');

    if (!currentWhiltelist.whiteListAddresses.length)
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'No data');

    const headings = [
      [
        'Wallet address',
        `Deposited (${currentIaoEvent.acceptedCurrencySymbol})`,
        `Purchased (${currentIaoEvent.tokenSymbol})`,
      ],
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(currentWhiltelist.whiteListAddresses, {
      origin: 'A2',
      skipHeader: true,
      header: ['walletAddress', 'deposited', 'purchased'],
    });

    XLSX.utils.sheet_add_aoa(ws, headings, { origin: 'A1' });
    XLSX.utils.book_append_sheet(wb, ws);

    const buffer = XLSX.write(wb, { bookType: 'csv', type: 'buffer' });
    res.attachment(
      `${CVS_NAME.WHITELIST}${currentIaoEvent.iaoEventId}_${moment().format(
        'DDMMYY',
      )}.csv`,
    );

    return res.status(200).send(buffer);
  }

  async checkRegistrationParticipation(checkTimeDTO: CheckTimeDTO) {
    const queryRegistrationStartTime = { $or: [] };
    const queryRegistrationEndTime = { $or: [] };
    const queryParticipationStartTime = { $or: [] };
    const queryParticipationEndTime = { $or: [] };

    // check with registrationStartTime
    queryRegistrationStartTime['$or'].push(
      {
        registrationStartTime: {
          $lte: checkTimeDTO.date,
          $gte: Utils.subtractDateByHour(
            checkTimeDTO.date,
            +process.env.IAO_EVENT_CHECK_HOURS,
          ),
        },
      },
      {
        registrationStartTime: {
          $gte: checkTimeDTO.date,
          $lte: Utils.addDateByHour(
            checkTimeDTO.date,
            +process.env.IAO_EVENT_CHECK_HOURS,
          ),
        },
      },
    );
    // check with registrationEndTime
    queryRegistrationEndTime['$or'].push(
      {
        registrationEndTime: {
          $lte: checkTimeDTO.date,
          $gte: Utils.subtractDateByHour(
            checkTimeDTO.date,
            +process.env.IAO_EVENT_CHECK_HOURS,
          ),
        },
      },
      {
        registrationEndTime: {
          $gte: checkTimeDTO.date,
          $lte: Utils.addDateByHour(
            checkTimeDTO.date,
            +process.env.IAO_EVENT_CHECK_HOURS,
          ),
        },
      },
    );
    // check with participationStartTime
    queryParticipationStartTime['$or'].push(
      {
        participationStartTime: {
          $lte: checkTimeDTO.date,
          $gte: Utils.subtractDateByHour(
            checkTimeDTO.date,
            +process.env.IAO_EVENT_CHECK_HOURS,
          ),
        },
      },
      {
        participationStartTime: {
          $gte: checkTimeDTO.date,
          $lte: Utils.addDateByHour(
            checkTimeDTO.date,
            +process.env.IAO_EVENT_CHECK_HOURS,
          ),
        },
      },
    );
    // check with participationEndTime
    queryParticipationEndTime['$or'].push(
      {
        participationEndTime: {
          $lte: checkTimeDTO.date,
          $gte: Utils.subtractDateByHour(
            checkTimeDTO.date,
            +process.env.IAO_EVENT_CHECK_HOURS,
          ),
        },
      },
      {
        participationEndTime: {
          $gte: checkTimeDTO.date,
          $lte: Utils.addDateByHour(
            checkTimeDTO.date,
            +process.env.IAO_EVENT_CHECK_HOURS,
          ),
        },
      },
    );

    return await this.getIaoEventCalender(
      queryRegistrationStartTime,
      queryRegistrationEndTime,
      queryParticipationStartTime,
      queryParticipationEndTime,
    );
  }

  async getIaoEventCalender(
    queryRegistrationStartTime,
    queryRegistrationEndTime,
    queryParticipationStartTime,
    queryParticipationEndTime,
  ) {
    let iaoEventList = [];
    const iaoEventListRegistrationStartTime =
      this.dataService.iaoEvent.findMany({
        ...queryRegistrationStartTime,
        status: IAO_EVENT_STATUS.ACTIVE,
        isDeleted: false,
      });
    const iaoEventListRegistrationEndTime = this.dataService.iaoEvent.findMany({
      ...queryRegistrationEndTime,
      status: IAO_EVENT_STATUS.ACTIVE,
      isDeleted: false,
    });
    const iaoEventListParticipationStartTime =
      this.dataService.iaoEvent.findMany({
        ...queryParticipationStartTime,
        status: IAO_EVENT_STATUS.ACTIVE,
        isDeleted: false,
      });
    const iaoEventListParticipationEndTime = this.dataService.iaoEvent.findMany(
      {
        ...queryParticipationEndTime,
        status: IAO_EVENT_STATUS.ACTIVE,
        isDeleted: false,
      },
    );

    let [getRegisStart, getRegisEnd, getParStart, getParEnd]: any =
      await Promise.all([
        queryRegistrationStartTime ? iaoEventListRegistrationStartTime : null,
        queryRegistrationEndTime ? iaoEventListRegistrationEndTime : null,
        queryParticipationStartTime ? iaoEventListParticipationStartTime : null,
        queryParticipationEndTime ? iaoEventListParticipationEndTime : null,
      ]);

    getRegisStart = getRegisStart
      ? this.iaoEventBuilderService.convertIaoEventToCheckTime(
          getRegisStart,
          IAO_EVENT_CALENDER.REGISTRATION_START,
        )
      : [];
    getRegisEnd = getRegisEnd
      ? this.iaoEventBuilderService.convertIaoEventToCheckTime(
          getRegisEnd,
          IAO_EVENT_CALENDER.REGISTRATION_END,
        )
      : [];
    getParStart = getParStart
      ? this.iaoEventBuilderService.convertIaoEventToCheckTime(
          getParStart,
          IAO_EVENT_CALENDER.PARTICIPATION_START,
        )
      : [];
    getParEnd = getParEnd
      ? this.iaoEventBuilderService.convertIaoEventToCheckTime(
          getParEnd,
          IAO_EVENT_CALENDER.PARTICIPATION_END,
        )
      : [];

    iaoEventList = iaoEventList.concat(
      getRegisStart,
      getRegisEnd,
      getParStart,
      getParEnd,
    );
    iaoEventList.sort((obj, _obj) => obj.date - _obj.date);

    return iaoEventList;
  }

  async getIaoEventListForCalender(calenderDTO: CalenderDTO) {
    const queryRegistrationStartTime = {};
    const queryRegistrationEndTime = {};
    const queryParticipationStartTime = {};
    const queryParticipationEndTime = {};

    // check with registrationStartTime
    queryRegistrationStartTime['registrationStartTime'] = {
      $gte: calenderDTO.dateFrom,
      $lte: calenderDTO.dateTo,
    };
    // // check with registrationEndTime
    queryRegistrationEndTime['registrationEndTime'] = {
      $gte: calenderDTO.dateFrom,
      $lte: calenderDTO.dateTo,
    };
    // // check with participationStartTime
    queryParticipationStartTime['participationStartTime'] = {
      $gte: calenderDTO.dateFrom,
      $lte: calenderDTO.dateTo,
    };
    // // check with participationEndTime
    queryParticipationEndTime['participationEndTime'] = {
      $gte: calenderDTO.dateFrom,
      $lte: calenderDTO.dateTo,
    };

    if (calenderDTO.keyword) {
      queryRegistrationStartTime['$or'] = [];
      queryRegistrationStartTime['$or'].push(
        {
          $and: [
            {
              'iaoEventName.en': {
                $regex: Utils.escapeRegex(calenderDTO.keyword.trim()),
                $options: 'i',
              },
            },
          ],
        },
        {
          $and: [
            {
              iaoEventId: {
                $regex: Utils.escapeRegex(calenderDTO.keyword.trim()),
                $options: 'i',
              },
            },
          ],
        },
        {
          $and: [
            {
              tokenSymbol: {
                $regex: Utils.escapeRegex(calenderDTO.keyword.trim()),
                $options: 'i',
              },
            },
          ],
        },
        {
          $and: [
            {
              FNFTcontractAddress: {
                $regex: Utils.escapeRegex(calenderDTO.keyword.trim()),
                $options: 'i',
              },
            },
          ],
        },
      );
      queryRegistrationEndTime['$or'] = [];
      queryRegistrationEndTime['$or'].push(
        {
          $and: [
            {
              'iaoEventName.en': {
                $regex: Utils.escapeRegex(calenderDTO.keyword.trim()),
                $options: 'i',
              },
            },
          ],
        },
        {
          $and: [
            {
              iaoEventId: {
                $regex: Utils.escapeRegex(calenderDTO.keyword.trim()),
                $options: 'i',
              },
            },
          ],
        },
        {
          $and: [
            {
              tokenSymbol: {
                $regex: Utils.escapeRegex(calenderDTO.keyword.trim()),
                $options: 'i',
              },
            },
          ],
        },
        {
          $and: [
            {
              FNFTcontractAddress: {
                $regex: Utils.escapeRegex(calenderDTO.keyword.trim()),
                $options: 'i',
              },
            },
          ],
        },
      );
      queryParticipationStartTime['$or'] = [];
      queryParticipationStartTime['$or'].push(
        {
          $and: [
            {
              'iaoEventName.en': {
                $regex: Utils.escapeRegex(calenderDTO.keyword.trim()),
                $options: 'i',
              },
            },
          ],
        },
        {
          $and: [
            {
              iaoEventId: {
                $regex: Utils.escapeRegex(calenderDTO.keyword.trim()),
                $options: 'i',
              },
            },
          ],
        },
        {
          $and: [
            {
              tokenSymbol: {
                $regex: Utils.escapeRegex(calenderDTO.keyword.trim()),
                $options: 'i',
              },
            },
          ],
        },
        {
          $and: [
            {
              FNFTcontractAddress: {
                $regex: Utils.escapeRegex(calenderDTO.keyword.trim()),
                $options: 'i',
              },
            },
          ],
        },
      );
      queryParticipationEndTime['$or'] = [];
      queryParticipationEndTime['$or'].push(
        {
          $and: [
            {
              'iaoEventName.en': {
                $regex: Utils.escapeRegex(calenderDTO.keyword.trim()),
                $options: 'i',
              },
            },
          ],
        },
        {
          $and: [
            {
              iaoEventId: {
                $regex: Utils.escapeRegex(calenderDTO.keyword.trim()),
                $options: 'i',
              },
            },
          ],
        },
        {
          $and: [
            {
              tokenSymbol: {
                $regex: Utils.escapeRegex(calenderDTO.keyword.trim()),
                $options: 'i',
              },
            },
          ],
        },
        {
          $and: [
            {
              FNFTcontractAddress: {
                $regex: Utils.escapeRegex(calenderDTO.keyword.trim()),
                $options: 'i',
              },
            },
          ],
        },
      );
    }
    let iaoEventList = [];
    //
    if (calenderDTO.iaoEventStage) {
      iaoEventList = await this.getIaoEventCalender(
        calenderDTO.iaoEventStage.includes(
          IAO_EVENT_CALENDER.REGISTRATION_START,
        )
          ? queryRegistrationStartTime
          : null,
        calenderDTO.iaoEventStage.includes(IAO_EVENT_CALENDER.REGISTRATION_END)
          ? queryRegistrationEndTime
          : null,
        calenderDTO.iaoEventStage.includes(
          IAO_EVENT_CALENDER.PARTICIPATION_START,
        )
          ? queryParticipationStartTime
          : null,
        calenderDTO.iaoEventStage.includes(IAO_EVENT_CALENDER.PARTICIPATION_END)
          ? queryParticipationEndTime
          : null,
      );
    } else {
      iaoEventList = await this.getIaoEventCalender(
        queryRegistrationStartTime,
        queryRegistrationEndTime,
        queryParticipationStartTime,
        queryParticipationEndTime,
      );
    }
    //
    const groups = iaoEventList.reduce((groups, iao) => {
      const day = iao.date
        .toLocaleString('en', { timeZone: calenderDTO.timezone })
        .split(',')[0];
      if (!groups[day]) {
        groups[day] = [];
      }
      groups[day].push(iao);
      return groups;
    }, {});
    //
    const groupArrays = Object.keys(groups).map((day) => {
      return {
        day,
        data: groups[day],
      };
    });
    return groupArrays;
  }

  checkCurrentStage(
    registrationStartTime: Date,
    registrationEndTime: Date,
    participationStartTime: Date,
    participationEndTime: Date,
    type: number,
    vaultUnlockThreshold?: boolean,
  ) {
    const nowDate = new Date();
    let currentStage;
    if (nowDate < registrationStartTime)
      currentStage = IAO_EVENT_STAGE.UPCOMING;
    else if (nowDate >= registrationStartTime && nowDate < registrationEndTime)
      currentStage = IAO_EVENT_STAGE.REGISTER_NOW;
    else if (nowDate >= registrationEndTime && nowDate < participationStartTime)
      currentStage = IAO_EVENT_STAGE.ON_SALE_SOON;
    else if (
      nowDate >= participationStartTime &&
      nowDate < participationEndTime
    )
      currentStage = IAO_EVENT_STAGE.ON_SALE;
    else if (nowDate >= participationEndTime && type === VAULT_TYPE.NON_VAULT)
      currentStage = IAO_EVENT_STAGE.COMPLETED;
    else if (
      nowDate >= participationEndTime &&
      type === VAULT_TYPE.VAULT &&
      vaultUnlockThreshold
    )
      currentStage = IAO_EVENT_STAGE.COMPLETED;
    else currentStage = IAO_EVENT_STAGE.FAILED;

    return currentStage;
  }
}
