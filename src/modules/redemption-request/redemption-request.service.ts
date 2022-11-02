import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { get } from 'lodash';
import {
  DEFAULT_LIMIT,
  DEFAULT_OFFET,
  ErrorCode,
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
import { ASSET_STATUS, REDEMPTION_REQUEST_STATUS } from 'src/datalayer/model';

@Injectable()
export class RedemptionRequestService {
  constructor(
    private readonly dataService: IDataServices,
    private readonly redemptionRequestBuilderService: RedemptionRequestBuilderService,
    @InjectConnection() private readonly connection: mongoose.Connection,
  ) {}

  async getListRedemptionRequest(
    user: any,
    filter: FilterRedemptionRequestDto,
  ) {
    const query: any = {};

    if (filter.name) {
      query['$or'] = [
        { requestId: { $regex: filter.name.trim(), $options: 'i' } },
        { createdBy: { $regex: filter.name.trim(), $options: 'i' } },
        { items: { $regex: filter.name.trim(), $options: 'i' } },
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
            { $project: { userId: 1, walletAddress: 1 } },
          ],
          as: 'User',
        },
      },
      {
        $addFields: {
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
          createdBy: { $first: '$createdBy' },
          createdAt: { $first: '$createdAt' },
        },
      },
    );

    let sort: any = { $sort: {} };
    if (filter.sortField && filter.sortType) {
      sort['$sort'][filter.sortField] = filter.sortType;
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

    const dataUpdate =
      await this.redemptionRequestBuilderService.updateRedemptionRequest(
        data,
        user.adminId,
      );

    return await this.dataService.redemptionRequest.findOneAndUpdate(
      {
        requestId,
        status: REDEMPTION_REQUEST_STATUS.IN_REVIEW,
        updatedAt: currentRequest['updatedAt'],
      },
      dataUpdate,
      { new: true },
    );
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

    try {
      const updareRequest = await this.dataService.redemptionRequest.updateOne(
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
      if (updareRequest.modifiedCount === 0)
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
}
