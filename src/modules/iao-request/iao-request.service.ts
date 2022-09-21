import { Injectable } from '@nestjs/common';
import { IDataServices } from 'src/core/abstracts/data-services.abstract';
import { FilterIAORequestDto } from './dto/filter-iao-request.dto';
import { get } from 'lodash';
import moment = require('moment');
import {
  AssetType,
  IAORequest,
  Asset,
  Fractor,
  IAO_REQUEST_STATUS,
  ASSET_STATUS,
} from 'src/datalayer/model';
import { IaoRequestBuilderService } from './iao-request.factory.service';
import { ApproveIaoRequestDTO } from './dto/approve-iao-request.dto';
import { Role } from '../auth/role.enum';
import { InjectConnection } from '@nestjs/mongoose';
import mongoose from 'mongoose';

export interface ListDocument {
  docs?: any[];
  totalDocs?: number;
}

@Injectable()
export class IaoRequestService {
  constructor(
    private readonly dataService: IDataServices,
    private readonly iaoRequestBuilderService: IaoRequestBuilderService,
    @InjectConnection() private readonly connection: mongoose.Connection,
  ) {}
  async findAll(filter: FilterIAORequestDto) {
    const query = {};

    if (filter.keyword) {
      let fractors: any = await this.dataService.fractor.findMany(
        {
          $or: [
            {
              fullname: {
                $regex: filter.keyword.trim(),
                $options: 'i',
              },
            },
            {
              fractorId: {
                $regex: filter.keyword.trim(),
                $options: 'i',
              },
            },
          ],
        },
        { fractorId: 1 },
      );
      fractors = fractors.map((f) => f.fractorId);
      query['$or'] = [
        {
          iaoId: {
            $regex: filter.keyword.trim(),
            $options: 'i',
          },
        },
        { ownerId: { $in: fractors } },
      ];
    }

    if (filter.status) query['status'] = filter.status;
    if (filter.type) query['type'] = filter.type;

    // filter submitted
    if (filter.submittedFrom && filter.submittedTo) {
      query['createdAt'] = {
        $gte: moment(filter.submittedFrom, 'DD-MM-YYYY').toDate(),
        $lte: moment(filter.submittedTo, 'DD-MM-YYYY').toDate(),
      };
    } else if (filter.submittedFrom) {
      query['createdAt'] = {
        $gte: moment(filter.submittedFrom, 'DD-MM-YYYY').toDate(),
      };
    } else if (filter.submittedTo) {
      query['createdAt'] = {
        $lte: moment(filter.submittedTo, 'DD-MM-YYYY').toDate(),
      };
    }
    if (filter.submittedBy) {
      query['ownerId'] = {
        $regex: filter.submittedBy.trim(),
        $options: 'i',
      };
    }

    // filter 1st reviewed
    if (filter._1stReviewedFrom && filter._1stReviewedTo) {
      query['firstReviewer.createdAt'] = {
        $gte: moment(filter._1stReviewedFrom, 'DD-MM-YYYY').toDate(),
        $lte: moment(filter._1stReviewedTo, 'DD-MM-YYYY').toDate(),
      };
    } else if (filter._1stReviewedFrom) {
      query['firstReviewer.createdAt'] = {
        $gte: moment(filter._1stReviewedFrom, 'DD-MM-YYYY').toDate(),
      };
    } else if (filter._1stReviewedTo) {
      query['firstReviewer.createdAt'] = {
        $lte: moment(filter._1stReviewedTo, 'DD-MM-YYYY').toDate(),
      };
    }
    if (filter._1stReviewedBy) {
      query['ownerId'] = {
        $regex: filter._1stReviewedBy.trim(),
        $options: 'i',
      };
    }

    // filter 2st reviewed
    if (filter._2stReviewedFrom && filter._2stReviewedTo) {
      query['firstReviewer.createdAt'] = {
        $gte: moment(filter._2stReviewedFrom, 'DD-MM-YYYY').toDate(),
        $lte: moment(filter._2stReviewedTo, 'DD-MM-YYYY').toDate(),
      };
    } else if (filter._2stReviewedFrom) {
      query['firstReviewer.createdAt'] = {
        $gte: moment(filter._2stReviewedFrom, 'DD-MM-YYYY').toDate(),
      };
    } else if (filter._2stReviewedTo) {
      query['firstReviewer.createdAt'] = {
        $lte: moment(filter._2stReviewedTo, 'DD-MM-YYYY').toDate(),
      };
    }
    if (filter._2stReviewedBy) {
      query['ownerId'] = {
        $regex: filter._2stReviewedBy.trim(),
        $options: 'i',
      };
    }

    const agg = [];

    agg.push(
      {
        $match: query,
      },
      {
        $addFields: {
          sizeOfItem: { $size: '$items' },
        },
      },
      {
        $lookup: {
          from: 'Fractor',
          let: { ownerId: '$ownerId' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$$ownerId', '$fractorId'] },
              },
            },
            { $project: { _id: 1, fullname: 1, fractorId: 1 } },
          ],
          as: 'fractors',
        },
      },
      {
        $addFields: {
          fractor: { $arrayElemAt: ['$fractors', 0] },
        },
      },
    );

    agg.push(
      {
        $unwind: '$items',
      },
      {
        $lookup: {
          from: 'Asset',
          let: { itemId: '$items' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$itemId', '$$itemId'] },
              },
            },
            { $project: { _id: 1, name: 1, media: 1 } },
          ],
          as: 'lookupItems',
        },
      },
      {
        $addFields: {
          item: { $arrayElemAt: ['$lookupItems', 0] },
        },
      },
      {
        $group: {
          _id: '$_id',
          type: { $first: '$type' },
          status: { $first: '$status' },
          assetValuation: { $first: '$assetValuation' },
          totalSupply: { $first: '$totalSupply' },
          percentOffered: { $first: '$percentOffered' },
          eventDuration: { $first: '$eventDuration' },
          ownerId: { $first: '$ownerId' },
          usdPrice: { $first: '$usdPrice' },
          sizeOfItem: { $first: '$sizeOfItem' },
          items: { $push: '$item' },
          fractor: { $first: '$fractor' },
          requestId: { $first: '$iaoId' },
          createdAt: { $first: '$createdAt' },
          updatedAt: { $first: '$updatedAt' },
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
      { $skip: filter.offset || 0 },
      { $limit: filter.limit || 10 },
    ];
    agg.push({
      $facet: {
        count: [{ $count: 'count' }],
        data: dataReturnFilter,
      },
    });

    const dataQuery = await this.dataService.iaoRequest.aggregate(agg, {
      collation: { locale: 'en' },
    });

    const data = get(dataQuery, [0, 'data']);
    const count = get(dataQuery, [0, 'count', 0, 'count']) || 0;

    return {
      totalDocs: count,
      docs: data || [],
    } as ListDocument;
  }

  async findOne(id: string): Promise<IAORequest> {
    const iaos = await this.dataService.iaoRequest.aggregate([
      {
        $match: {
          iaoId: id,
        },
      },
      {
        $lookup: {
          from: 'Fractor',
          let: { ownerId: '$ownerId' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$$ownerId', '$fractorId'] },
              },
            },
            { $project: { _id: 1, fullname: 1, fractorId: 1 } },
          ],
          as: 'fractors',
        },
      },
      {
        $addFields: {
          fractor: { $arrayElemAt: ['$fractors', 0] },
        },
      },
      {
        $lookup: {
          from: 'Admin',
          let: { adminId: '$firstReviewer.adminId' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$$adminId', '$adminId'] },
              },
            },
            { $project: { _id: 1, fullname: 1, adminId: 1 } },
          ],
          as: '_firstReviewers',
        },
      },
      {
        $addFields: {
          _firstReviewer: { $arrayElemAt: ['$_firstReviewers', 0] },
        },
      },
      {
        $lookup: {
          from: 'Admin',
          let: { adminId: '$secondReviewer.adminId' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$$adminId', '$adminId'] },
              },
            },
            { $project: { _id: 1, fullname: 1, adminId: 1 } },
          ],
          as: '_secondReviewers',
        },
      },
      {
        $addFields: {
          _secondReviewer: { $arrayElemAt: ['$_secondReviewers', 0] },
        },
      },
      {
        $lookup: {
          from: Fractor.name,
          let: { fractorId: '$ownerId' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$$fractorId', '$fractorId'] },
              },
            },
            { $project: { _id: 1, fullname: 1, fractorId: 1 } },
          ],
          as: 'updatedBys',
        },
      },
      {
        $addFields: {
          updatedBy: { $arrayElemAt: ['$updatedBys', 0] },
        },
      },
      {
        $addFields: {
          sizeOfItem: { $size: '$items' },
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
            {
              $project: {
                itemId: 1,
                name: 1,
                media: 1,
                documents: 1,
                status: 1,
                typeId: 1,
                _id: 1,
              },
            },
          ],
          as: 'lookupItems',
        },
      },
      {
        $addFields: {
          item: { $arrayElemAt: ['$lookupItems', 0] },
        },
      },
      {
        $lookup: {
          from: AssetType.name,
          let: { typeId: '$item.typeId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [{ $toString: '$_id' }, { $toString: '$$typeId' }],
                },
              },
            },
            { $project: { _id: 1, name: 1, assetTypeId: 1, category: 1 } },
          ],
          as: 'assetTypes',
        },
      },
      {
        $addFields: {
          assetType: { $arrayElemAt: ['$assetTypes', 0] },
        },
      },
      {
        $addFields: {
          itemDetail: {
            _id: '$item._id',
            itemId: '$item.itemId',
            name: '$item.name',
            media: '$item.media',
            status: '$item.status',
            documents: '$item.documents',
            category: '$assetType.category',
            type: '$assetType.name',
          },
        },
      },
      {
        $group: {
          _id: '$_id',
          type: { $first: '$type' },
          status: { $first: '$status' },
          assetValuation: { $first: '$assetValuation' },
          totalSupply: { $first: '$totalSupply' },
          percentOffered: { $first: '$percentOffered' },
          percentVault: { $first: '$percentVault' },
          eventDuration: { $first: '$eventDuration' },
          ownerId: { $first: '$ownerId' },
          usdPrice: { $first: '$usdPrice' },
          sizeOfItem: { $first: '$sizeOfItem' },
          items: { $push: '$itemDetail' },
          fractor: { $first: '$fractor' },
          requestId: { $first: '$iaoId' },
          _firstReviewer: { $first: '$_firstReviewer' },
          firstReviewer: { $first: '$firstReviewer' },
          _secondReviewer: { $first: '$_secondReviewer' },
          secondReviewer: { $first: '$secondReviewer' },
          createdAt: { $first: '$createdAt' },
          updatedAt: { $first: '$updatedAt' },
          updatedBy: { $first: '$updatedBy' },
        },
      },
    ]);

    if (iaos.length === 0) throw 'No data exists';
    const iao = this.iaoRequestBuilderService.createIaoRequestDetail(iaos);
    return iao;
  }

  async firstApproveIaoRequest(
    approveIaoRequestDTO: ApproveIaoRequestDTO,
    user: any,
  ) {
    const iaoRequest = await this.dataService.iaoRequest.findOne({
      iaoId: approveIaoRequestDTO.requestId,
      status: IAO_REQUEST_STATUS.IN_REVIEW,
    });
    if (!iaoRequest) throw 'No data exists';

    const firstApproveRole = [Role.OWNER, Role.SuperAdmin, Role.OperationAdmin];

    if (!firstApproveRole.includes(user.role))
      throw 'You do not have permission for this action';

    if (iaoRequest.firstReviewer) throw 'This IAO request is approved';
    const firstReview = this.iaoRequestBuilderService.createFirstReview(
      approveIaoRequestDTO,
      user,
    );
    await this.dataService.iaoRequest.updateOne(
      {
        iaoId: approveIaoRequestDTO.requestId,
        status: IAO_REQUEST_STATUS.IN_REVIEW,
        updatedAt: iaoRequest['updatedAt'],
      },
      {
        $set: {
          firstReviewer: { ...firstReview },
          status: IAO_REQUEST_STATUS.APPROVED_A,
        },
      },
    );
    return approveIaoRequestDTO.requestId;
  }

  async secondApproveIaoRequest(
    approveIaoRequestDTO: ApproveIaoRequestDTO,
    user: any,
  ) {
    const secondApproveRole = [Role.OWNER, Role.SuperAdmin];

    if (!secondApproveRole.includes(user.role))
      throw 'You do not have permission for this action';

    const iaoRequest = await this.dataService.iaoRequest.findOne({
      iaoId: approveIaoRequestDTO.requestId,
      status: IAO_REQUEST_STATUS.APPROVED_A,
    });
    if (!iaoRequest) throw 'No data exists';

    if (iaoRequest.secondReviewer) throw 'This IAO request is approved';

    if (
      iaoRequest.firstReviewer &&
      iaoRequest.firstReviewer.adminId === user.adminId
    )
      throw 'Admin overlaps with first reviewer';

    const secondReview = this.iaoRequestBuilderService.createSecondReview(
      approveIaoRequestDTO,
      user,
    );

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      await this.dataService.iaoRequest.updateOne(
        {
          iaoId: approveIaoRequestDTO.requestId,
          status: IAO_REQUEST_STATUS.APPROVED_A,
          updatedAt: iaoRequest['updatedAt'],
        },
        {
          $set: {
            secondReviewer: { ...secondReview },
            status: IAO_REQUEST_STATUS.APPROVED_B,
          },
        },
        { session },
      );

      // update asset status
      const updateItems = iaoRequest.items.map((item) => {
        return {
          itemId: item,
        };
      });
      await this.dataService.asset.updateMany(
        {
          $or: updateItems,
          ownerId: iaoRequest.ownerId,
          status: ASSET_STATUS.IN_REVIEW,
          deleted: false,
        },
        {
          $set: { status: ASSET_STATUS.IAO_APPROVED },
        },
        { session },
      );
      await session.commitTransaction();
      return approveIaoRequestDTO.requestId;
    } catch (error) {
      await session.abortTransaction();
      throw 'Cannot approve this iao request';
    } finally {
      session.endSession();
    }
  }
}
