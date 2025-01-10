import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { get } from 'lodash';
import { Connection } from 'mongoose';
import { ApiError } from 'src/common/api';
import { CVS_NAME, ErrorCode } from 'src/common/constants';
import { Utils } from 'src/common/utils';
import { IDataServices } from 'src/core/abstracts/data-services.abstract';
import {
  AdminDocument,
  IAO_EVENT_STAGE,
  IAO_EVENT_STATUS,
  ON_CHAIN_STATUS,
  REVENUE_STATUS,
  VAULT_TYPE,
} from 'src/datalayer/model';
import { Role } from '../auth/role.enum';
import { IaoEventService } from '../iao-event/iao-event.service';
import { ApproveIaoRevenueDto } from './dto/approve-iao-revenue.dto';
import {
  GetListIaoRevenueDto,
  IAO_EVENT_STAGE_FILTERABLE,
} from './dto/get-list-iao-revenue.dto';
import { UpdateIaoRevenueDto } from './dto/update-iao-revenue.dto';
import { IaoRevenueBuilderService } from './revenue.factory';
import moment = require('moment');
const XLSX = require('xlsx');
@Injectable()
export class IaoRevenueService {
  constructor(
    private readonly dataService: IDataServices,
    private readonly iaoRevenuebuilderService: IaoRevenueBuilderService,
    private readonly iaoEventService: IaoEventService,
    @InjectConnection() private readonly connection: Connection,
  ) {}
  async getListIaoRevenue(filter: GetListIaoRevenueDto, user: AdminDocument) {
    const query = {};
    const dateQuery = [];
    if (filter.keyword) {
      query['$or'] = [
        {
          iaoEventIdToSearch: {
            $regex: Utils.escapeRegex(filter.keyword.trim()),
            $options: 'i',
          },
        },
        {
          'iaoEventName.en': {
            $regex: Utils.escapeRegex(filter.keyword.trim()),
            $options: 'i',
          },
        },
        {
          'fractor.fullname': {
            $regex: Utils.escapeRegex(filter.keyword.trim()),
            $options: 'i',
          },
        },
        {
          'fractor.fractorId': {
            $regex: Utils.escapeRegex(filter.keyword.trim()),
            $options: 'i',
          },
        },
        {
          'bd.fullname': {
            $regex: Utils.escapeRegex(filter.keyword.trim()),
            $options: 'i',
          },
        },
        {
          'bd.adminId': {
            $regex: Utils.escapeRegex(filter.keyword.trim()),
            $options: 'i',
          },
        },
      ];
    }
    if (filter.status || filter.status === REVENUE_STATUS.PENDING)
      query['revenue.status'] = filter.status;
    if (filter.stage === IAO_EVENT_STAGE_FILTERABLE.ON_SALE) {
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
    if (filter.stage === IAO_EVENT_STAGE_FILTERABLE.COMPLETED) {
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

    if (filter.stage === IAO_EVENT_STAGE_FILTERABLE.FAILED) {
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

    if (filter.startFrom)
      dateQuery.push({
        participationStartTime: {
          $gte: new Date(filter.startFrom),
        },
      });
    if (filter.startTo)
      dateQuery.push({
        participationStartTime: {
          $lte: new Date(filter.startTo),
        },
      });
    if (dateQuery.length) query['$and'] = dateQuery;
    const agg = [];
    agg.push(
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
    );

    //if admin's role is BD of Fractor
    if (user.role === Role.FractorBD) {
      const listFractor = await this.dataService.fractor.findMany({
        assignedBD: user.adminId,
      });
      const mappedListFractorId = listFractor.map(
        (fractor) => fractor.fractorId,
      );
      agg.push({
        $match: {
          $expr: {
            $in: ['$iaoRequest.ownerId', mappedListFractorId],
          },
        },
      });
    }
    agg.push(
      {
        $match: {
          isDeleted: false,
          // $or: [
          //   {
          //     status: IAO_EVENT_STATUS.ACTIVE,
          //   },
          //   {
          //     status: IAO_EVENT_STATUS.INACTIVE,
          //     'revenue.status': REVENUE_STATUS.REJECTED,
          //   },
          // ],
          onChainStatus: ON_CHAIN_STATUS.ON_CHAIN,
        },
      },
      {
        $lookup: {
          from: 'Whitelist',
          let: { id: '$iaoEventId' },
          pipeline: [
            {
              $match: {
                deleted: false,
                $expr: {
                  $eq: ['$iaoEventId', '$$id'],
                },
              },
            },
          ],
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
        $lookup: {
          from: 'Nft',
          localField: 'iaoRequest.items',
          foreignField: 'assetId',
          as: 'nfts',
        },
      },
      {
        $lookup: {
          from: 'Fractor',
          localField: 'iaoRequest.ownerId',
          foreignField: 'fractorId',
          as: 'fractor',
        },
      },
      {
        $unwind: {
          path: '$fractor',
        },
      },
      {
        $lookup: {
          from: 'Admin',
          localField: 'fractor.assignedBD',
          foreignField: 'adminId',
          as: 'bd',
        },
      },
      {
        $unwind: {
          path: '$bd',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          iaoRequest: 0,
        },
      },
      {
        $addFields: {
          participatedByFiatAmount: '$participatedByFiatAmount',
          iaoEventIdToSearch: '$iaoEventId',
          iaoEventId: {
            $toInt: { $substr: ['$iaoEventId', 3, -1] },
          },
          participants: {
            $cond: {
              if: { $isArray: '$whitelist.whiteListAddresses' },
              then: { $size: '$whitelist.whiteListAddresses' },
              else: 0,
            },
          },
          soldAmount: { $subtract: ['$totalSupply', '$availableSupply'] },
          participatedAmount: {
            $multiply: [
              { $subtract: ['$totalSupply', { $add: [ '$availableSupply', '$soldAmountByFiat' ] }] },
              '$exchangeRate',
            ],
          },
          progress: {
            $multiply: [
              { $subtract: ['$totalSupply', '$availableSupply'] },
              { $divide: [1, '$totalSupply'] },
              100,
            ],
          },
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
      sort = { $sort: { participationStartTime: 1 } };
    }
    const dataReturnFilter = [sort, { $skip: filter.offset || 0 }];
    if (filter.limit !== -1)
      dataReturnFilter.push({ $limit: filter.limit || 10 });
    agg.push({
      $facet: {
        count: [{ $count: 'count' }],
        data: dataReturnFilter,
      },
    });
    const dataQuery = await this.dataService.iaoEvent.aggregate(agg, {
      collation: { locale: 'en' },
    });
    const data = get(dataQuery, [0, 'data']);
    const count = get(dataQuery, [0, 'count', 0, 'count']) || 0;
    const finalData = this.iaoRevenuebuilderService.convertListIaoRevenue(data);
    return {
      totalDocs: count,
      docs: finalData,
    };
  }

  async exportIaoRevenue(
    filter: GetListIaoRevenueDto,
    user: AdminDocument,
    res: any,
  ) {
    const query = {};
    const dateQuery = [];
    if (filter.keyword) {
      query['$or'] = [
        {
          iaoEventIdToSearch: {
            $regex: Utils.escapeRegex(filter.keyword.trim()),
            $options: 'i',
          },
        },
        {
          'iaoEventName.en': {
            $regex: Utils.escapeRegex(filter.keyword.trim()),
            $options: 'i',
          },
        },
        {
          'fractor.fullname': {
            $regex: Utils.escapeRegex(filter.keyword.trim()),
            $options: 'i',
          },
        },
        {
          'fractor.fractorId': {
            $regex: Utils.escapeRegex(filter.keyword.trim()),
            $options: 'i',
          },
        },
        {
          'bd.fullname': {
            $regex: Utils.escapeRegex(filter.keyword.trim()),
            $options: 'i',
          },
        },
        {
          'bd.adminId': {
            $regex: Utils.escapeRegex(filter.keyword.trim()),
            $options: 'i',
          },
        },
      ];
    }
    if (filter.status || filter.status === REVENUE_STATUS.PENDING)
      query['revenue.status'] = filter.status;
    if (filter.stage === IAO_EVENT_STAGE_FILTERABLE.ON_SALE) {
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
    if (filter.stage === IAO_EVENT_STAGE_FILTERABLE.COMPLETED) {
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

    if (filter.stage === IAO_EVENT_STAGE_FILTERABLE.FAILED) {
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

    if (filter.startFrom)
      dateQuery.push({
        participationStartTime: {
          $gte: new Date(filter.startFrom),
        },
      });
    if (filter.startTo)
      dateQuery.push({
        participationStartTime: {
          $lte: new Date(filter.startTo),
        },
      });
    if (dateQuery.length) query['$and'] = dateQuery;
    const agg = [];
    agg.push(
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
    );

    //if admin's role is BD of Fractor
    if (user.role === Role.FractorBD) {
      const listFractor = await this.dataService.fractor.findMany({
        assignedBD: user.adminId,
      });
      const mappedListFractorId = listFractor.map(
        (fractor) => fractor.fractorId,
      );
      agg.push({
        $match: {
          $expr: {
            $in: ['$iaoRequest.ownerId', mappedListFractorId],
          },
        },
      });
    }
    agg.push(
      {
        $match: {
          isDeleted: false,
          // $or: [
          //   {
          //     status: IAO_EVENT_STATUS.ACTIVE,
          //   },
          //   {
          //     status: IAO_EVENT_STATUS.INACTIVE,
          //     'revenue.status': REVENUE_STATUS.REJECTED,
          //   },
          // ],
          onChainStatus: ON_CHAIN_STATUS.ON_CHAIN,
        },
      },
      {
        $lookup: {
          from: 'Whitelist',
          let: { id: '$iaoEventId' },
          pipeline: [
            {
              $match: {
                deleted: false,
                $expr: {
                  $eq: ['$iaoEventId', '$$id'],
                },
              },
            },
          ],
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
        $lookup: {
          from: 'Nft',
          localField: 'iaoRequest.items',
          foreignField: 'assetId',
          as: 'nfts',
        },
      },
      {
        $lookup: {
          from: 'Fractor',
          localField: 'iaoRequest.ownerId',
          foreignField: 'fractorId',
          as: 'fractor',
        },
      },
      {
        $unwind: {
          path: '$fractor',
        },
      },
      {
        $lookup: {
          from: 'Admin',
          localField: 'fractor.assignedBD',
          foreignField: 'adminId',
          as: 'bd',
        },
      },
      {
        $unwind: {
          path: '$bd',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'Admin',
          localField: 'revenue.finalizedBy',
          foreignField: 'adminId',
          as: 'finalizedByAdmin',
        },
      },
      {
        $unwind: {
          path: '$finalizedByAdmin',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          iaoRequest: 0,
        },
      },
      {
        $addFields: {
          iaoEventIdToSearch: '$iaoEventId',
          iaoEventId: {
            $toInt: { $substr: ['$iaoEventId', 3, -1] },
          },
          participants: {
            $cond: {
              if: { $isArray: '$whitelist.whiteListAddresses' },
              then: { $size: '$whitelist.whiteListAddresses' },
              else: 0,
            },
          },
          soldAmount: { $subtract: ['$totalSupply', '$availableSupply'] },
          participatedAmount: {
            $multiply: [
              { $subtract: ['$totalSupply', { $add: [ '$availableSupply', '$soldAmountByFiat' ] }] },
              '$exchangeRate',
            ],
          },
          progress: {
            $multiply: [
              { $subtract: ['$totalSupply', '$availableSupply'] },
              { $divide: [1, '$totalSupply'] },
              100,
            ],
          },
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
      sort = { $sort: { participationStartTime: 1 } };
    }
    const dataReturnFilter = [sort];
    agg.push({
      $facet: {
        data: dataReturnFilter,
      },
    });
    const dataQuery = await this.dataService.iaoEvent.aggregate(agg, {
      collation: { locale: 'en' },
    });
    const data = get(dataQuery, [0, 'data']);
    const finalData =
      this.iaoRevenuebuilderService.convertExportedIaoRevenue(data);

    const headings = [
      [
        'Event ID',
        'Participation Start Time (UTC)',
        'Participation End Time (UTC)',
        'Event Name',
        'Event Type',
        'IAO Stage',
        'Revenue Status',
        'Currency',
        'Participated Amount',
        'Participated Fiat Amount',
        'Gross Revenue',
        'Gross Fiat Revenue',
        "Platform's Commission Rate",
        "Platform's Commission",
        "Platform's Fiat Commission",
        "Fractor's NET Revenue",
        "Fractor's NET Fiat Revenue",
        "BD's Commission",
        "BD's Fiat Commission",
        'Fractor',
        'BD',
        'Finalized on (UTC)',
        'Finalized by',
      ],
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(finalData, {
      origin: 'A2',
      skipHeader: true,
      header: [
        'iaoEventId',
        'participationStartTime',
        'participationEndTime',
        'iaoEventName',
        'vaultType',
        'stage',
        'revenueStatus',
        'acceptedCurrencySymbol',
        'participatedAmount',
        'participatedByFiatAmount',
        'grossRevenue',
        'grossRevenueByFiat',
        'platformComissionRate',
        'platformGrossCommission',
        'platformGrossCommissionByFiat',
        'fractorNetRevenue',
        'fractorNetRevenueByFiat',
        'bdCommission',
        'bdCommissionByFiat',
        'fractor',
        'assignedBD',
        'finalizedOn',
        'finalizedBy',
      ],
    });
    XLSX.utils.sheet_add_aoa(ws, headings, { origin: 'A1' });
    XLSX.utils.book_append_sheet(wb, ws);
    const buffer = XLSX.write(wb, { bookType: 'csv', type: 'buffer' });
    res.attachment(`${CVS_NAME.IAO_REVENUE}${moment().format('DDMMYY')}.csv`);
    return res.status(200).send(buffer);
  }

  async getIaoRevenueDetail(iaoEventId: string, user: AdminDocument) {
    const iaoEvent = await this.dataService.iaoEvent.findOne({
      iaoEventId,
      isDeleted: false,
    });
    if (!iaoEventId)
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'IAO event does not exist');

    const iaoRequest = await this.dataService.iaoRequest.findOne({
      iaoId: iaoEvent.iaoRequestId,
    });

    const listNft = await this.dataService.nft.findMany({
      assetId: {
        $in: iaoRequest.items,
      },
    });

    const fractor = await this.dataService.fractor.findOne({
      fractorId: iaoRequest.ownerId,
    });
    //if admin's role is BD of Fractor
    if (user.role === Role.FractorBD) {
      const listFractorOfBD = await this.dataService.fractor.findMany({
        assignedBD: user.adminId,
      });
      const mappedListFractorOfBDId = listFractorOfBD.map(
        (fractor) => fractor.fractorId,
      );

      if (!mappedListFractorOfBDId.includes(fractor?.fractorId))
        throw ApiError(
          ErrorCode.DEFAULT_ERROR,
          'You can not access this IAO event',
          '',
          HttpStatus.UNAUTHORIZED,
        );
    }
    const bd = await this.dataService.admin.findOne({
      adminId: fractor.assignedBD,
    });
    const whiteList = await this.dataService.whitelist.findOne({
      iaoEventId: iaoEvent.iaoEventId,
      deleted: false,
    });
    const updatedByAdmin = await this.dataService.admin.findOne({
      adminId: iaoEvent.revenue.updatedBy,
    });
    const finalizedByAdmin = await this.dataService.admin.findOne({
      adminId: iaoEvent.revenue.finalizedBy,
    });

    const iaoEventDetail =
      this.iaoRevenuebuilderService.convertIaoRevenueDetail(
        iaoEvent,
        whiteList,
        fractor,
        bd,
        listNft,
        updatedByAdmin,
        finalizedByAdmin,
      );
    return iaoEventDetail;
  }

  async updateIaoRevenue(
    iaoEventId: string,
    body: UpdateIaoRevenueDto,
    user: AdminDocument,
  ) {
    const iaoEvent = await this.dataService.iaoEvent.findOne({
      iaoEventId,
      isDeleted: false,
    });
    if (!iaoEventId)
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'IAO event does not exist');
    if (
      body.bdCommissionRate &&
      iaoEvent.revenue.status > REVENUE_STATUS.IN_REVIEW
    )
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'Can not update IAO revenue');
    if (
      body.comment &&
      iaoEvent.revenue.status !== REVENUE_STATUS.APPROVED &&
      iaoEvent.revenue.status !== REVENUE_STATUS.REJECTED
    )
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'Can not update IAO revenue');
    const res = await this.dataService.iaoEvent.findOneAndUpdate(
      {
        iaoEventId,
        isDeleted: false,
        updatedAt: iaoEvent['updatedAt'],
      },
      {
        $set: {
          'revenue.bdCommissionRate': body.bdCommissionRate,
          'revenue.comment': body.comment,
          'revenue.updatedBy': user.adminId,
          'revenue.updatedAt': new Date(),
        },
      },
    );
    if (!res)
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'Can not update IAO revenue');
    return { success: true };
  }

  async approveIaoRevenue(iaoEventId: string, body: ApproveIaoRevenueDto) {
    const iaoEvent = await this.dataService.iaoEvent.findOne({
      iaoEventId,
      isDeleted: false,
    });
    if (!iaoEventId)
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'IAO event does not exist');
    const stage = this.iaoEventService.checkCurrentStage(
      iaoEvent.registrationStartTime,
      iaoEvent.registrationEndTime,
      iaoEvent.participationStartTime,
      iaoEvent.participationEndTime,
      iaoEvent.vaultType,
      iaoEvent.totalSupply - iaoEvent.availableSupply >=
        (iaoEvent.vaultUnlockThreshold * iaoEvent.totalSupply) / 100,
    );
    if (
      iaoEvent.revenue.status >= REVENUE_STATUS.APPROVED ||
      (iaoEvent.revenue.status === REVENUE_STATUS.PENDING &&
        stage === IAO_EVENT_STAGE.FAILED)
    )
      throw ApiError(
        ErrorCode.DEFAULT_ERROR,
        'Can not approve this IAO revenue',
      );
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const res = await this.dataService.iaoEvent.findOneAndUpdate(
        {
          iaoEventId,
          isDeleted: false,
          updatedAt: iaoEvent['updatedAt'],
        },
        {
          $set: {
            'revenue.bdCommissionRate': body.bdCommissionRate,
            'revenue.platformCommissionRate': body.platformCommissionRate,
          },
        },
        {
          session,
        },
      );
      if (!res)
        throw ApiError(ErrorCode.DEFAULT_ERROR, 'Can not approve IAO revenue');
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
    return { success: true };
  }
}
