import { Injectable } from '@nestjs/common';
import { Utils } from 'src/common/utils';
import { IDataServices } from 'src/core/abstracts/data-services.abstract';
import {
  AdminDocument,
  IAO_EVENT_STAGE,
  IAO_EVENT_STATUS,
  REVENUE_STATUS,
  UserDocument,
  VAULT_TYPE,
} from 'src/datalayer/model';
import { GetListIaoRevenueDto } from './dto/get-list-iao-revenue.dto';
import { get } from 'lodash';
import { IaoRevenueBuilderService } from './revenue.factory';
import { Role } from '../auth/role.enum';
import { ApiError } from 'src/common/api';
import { ErrorCode } from 'src/common/constants';
import { UpdateIaoRevenueDto } from './dto/update-iao-revenue.dto';
@Injectable()
export class IaoRevenueService {
  constructor(
    private readonly dataService: IDataServices,
    private readonly iaoRevenuebuilderService: IaoRevenueBuilderService,
  ) {}
  async getListIaoRevenue(filter: GetListIaoRevenueDto, user: AdminDocument) {
    const query = {};
    const dateQuery = [];
    if (filter.keyword) {
      query['$or'] = [
        {
          iaoEventId: {
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
          'fractor.name': {
            $regex: Utils.escapeRegex(filter.keyword.trim()),
            $options: 'i',
          },
        },
        {
          'bd.name': {
            $regex: Utils.escapeRegex(filter.keyword.trim()),
            $options: 'i',
          },
        },
      ];
    }
    if (filter.status) query['revenue.status'] = filter.status;
    if (filter.status === REVENUE_STATUS.PENDING) {
      query['participationEndTime'] = { $lte: new Date() };
    }
    if (filter.status === REVENUE_STATUS.IN_REVIEW) {
      query['revenue.status'] = REVENUE_STATUS.PENDING;
      query['participationEndTime'] = { $gte: new Date() };
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

    if (filter.startFrom)
      dateQuery.push({
        participationStartTime: {
          $gte: filter.startFrom,
        },
      });
    if (filter.startTo)
      dateQuery.push({
        participationStartTime: {
          $lte: filter.startTo,
        },
      });
    if (dateQuery.length) query['$and'] = dateQuery;
    const agg = [];
    if (user.role === Role.FractorBD) {
      const listFractor = await this.dataService.fractor.findMany({
        assignedBD: user.adminId,
      });
      const mappedListFractorId = listFractor.map(
        (fractor) => fractor.fractorId,
      );
      agg.push([
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
          $match: {
            $expr: {
              $in: ['$iaoRequest.ownerId', mappedListFractorId],
            },
          },
        },
        {
          $project: {
            iaoRequest: 0,
          },
        },
      ]);
    }
    agg.push(
      {
        $match: {
          isDeleted: false,
          status: IAO_EVENT_STATUS.ACTIVE,
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
              { $subtract: ['$totalSupply', '$availableSupply'] },
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
      sort = { $sort: { participationStartTime: -1 } };
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
    const fractor = await this.dataService.fractor.findOne({
      fractorId: iaoRequest.ownerId,
    });
    if (user.role === Role.FractorBD) {
      const listFractorOfBD = await this.dataService.fractor.findMany({
        assignBD: user.adminId,
      });
      const mappedListFractorOfBDId = listFractorOfBD.map(
        (fractor) => fractor.fractorId,
      );
      if (!mappedListFractorOfBDId.includes(fractor.fractorId))
        throw ApiError(
          ErrorCode.DEFAULT_ERROR,
          'You can not access this IAO event',
        );
    }
    const whiteList = await this.dataService.whitelist.findOne({
      iaoEventId: iaoEvent.iaoEventId,
    });

    const iaoEventDetail =
      this.iaoRevenuebuilderService.convertIaorevenueDetail(
        iaoEvent,
        whiteList,
        fractor,
      );
    return iaoEventDetail;
  }

  async updateIaoRevenue(iaoEventId: string, body: UpdateIaoRevenueDto) {
    const iaoEvent = await this.dataService.iaoEvent.findOne({
      iaoEventId,
      isDeleted: false,
    });
    if (!iaoEventId)
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'IAO event does not exist');
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
        },
      },
    );
    if (res) return { success: true };
  }
}
