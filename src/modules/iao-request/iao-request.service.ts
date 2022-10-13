import { Injectable } from '@nestjs/common';
import { IDataServices } from 'src/core/abstracts/data-services.abstract';
import {
  DetailIAORequestDto,
  FilterIAORequestDto,
} from './dto/filter-iao-request.dto';
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
import { EditReviewComment } from './dto/edit-review-comment.dto';
import { DEFAULT_LIMIT, DEFAULT_OFFET, ErrorCode } from 'src/common/constants';
import {
  DISPLAY_STATUS,
  FilterDocumentDto,
} from '../asset/dto/filter-document.dto';
import { Utils } from 'src/common/utils';
import {
  CreateDocumentItemDto,
  UpdateDocumentItemDto,
} from '../asset/dto/documentItem.dto';
import { ApiError } from 'src/common/api';
import { MAX_FILE_SIZE } from 'src/datalayer/model/document-item.model';
const ufs = require('url-file-size');

export interface ListDocument {
  docs?: any[];
  metadata?: object;
  totalDocs?: number;
}

@Injectable()
export class IaoRequestService {
  constructor(
    private readonly dataService: IDataServices,
    private readonly iaoRequestBuilderService: IaoRequestBuilderService,
    @InjectConnection() private readonly connection: mongoose.Connection,
  ) {}
  async findAll(filter: FilterIAORequestDto, user: any) {
    const iaoRequestRole = [
      Role.FractorBD,
      Role.HeadOfBD,
      Role.OperationAdmin,
      Role.SuperAdmin,
      Role.OWNER,
    ];
    if (!iaoRequestRole.includes(user.role))
      throw 'You do not have permission for this action';

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
            { $project: { _id: 1, fullname: 1, fractorId: 1, avatar: 1 } },
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
        $unwind: {
          path: '$items',
          preserveNullAndEmptyArrays: true,
        },
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
          iaoId: { $first: '$iaoId' },
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
      { $skip: filter.offset || DEFAULT_OFFET },
      { $limit: filter.limit || DEFAULT_LIMIT },
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

  async findOne(
    id: string,
    user: any,
    filter: DetailIAORequestDto,
  ): Promise<IAORequest> {
    const iaoRequestRole = [
      Role.FractorBD,
      Role.HeadOfBD,
      Role.OperationAdmin,
      Role.SuperAdmin,
      Role.OWNER,
    ];
    if (!iaoRequestRole.includes(user.role))
      throw 'You do not have permission for this action';

    const agg = [];

    agg.push(
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
    );

    if (filter.isGetNft) {
      agg.push(
        {
          $lookup: {
            from: 'Nft',
            let: { itemId: '$items' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$assetId', '$$itemId'] },
                },
              },
              {
                $project: {
                  assetCategory: 1,
                  name: 1,
                  tokenId: 1,
                  mediaUrl: 1,
                  status: 1,
                },
              },
            ],
            as: 'nfts',
          },
        },
        {
          $addFields: {
            nft: { $arrayElemAt: ['$nfts', 0] },
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
              nftName: '$nft.name',
              tokenId: '$nft.tokenId',
              nftMedia: '$nft.mediaUrl',
              nftStatus: '$nft.status',
              assetCategory: '$nft.assetCategory',
            },
          },
        },
      );
    } else {
      agg.push({
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
      });
    }

    agg.push({
      $group: {
        _id: '$_id',
        type: { $first: '$type' },
        status: { $first: '$status' },
        assetValuation: { $first: '$assetValuation' },
        totalSupply: { $first: '$totalSupply' },
        percentOffered: { $first: '$percentOffered' },
        percentVault: { $first: '$percentVault' },
        eventDuration: { $first: '$eventDuration' },
        walletAddress: { $first: '$walletAddress' },
        phone: { $first: '$phone' },
        address: { $first: '$address' },
        note: { $first: '$note' },
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
        documents: { $first: '$documents' },
        createdAt: { $first: '$createdAt' },
        updatedAt: { $first: '$updatedAt' },
        updatedBy: { $first: '$updatedBy' },
      },
    });

    const iaos = await this.dataService.iaoRequest.aggregate(agg);

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

    this._validateFirstReviewer(iaoRequest, user);

    const firstReview = this.iaoRequestBuilderService.createFirstReview(
      approveIaoRequestDTO,
      user,
    );
    const updateIaoRequest = await this.dataService.iaoRequest.updateOne(
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
    if (updateIaoRequest.modifiedCount === 0)
      throw 'Cannot approve IAO request';
    return approveIaoRequestDTO.requestId;
  }

  async secondApproveIaoRequest(
    approveIaoRequestDTO: ApproveIaoRequestDTO,
    user: any,
  ) {
    const iaoRequest = await this.dataService.iaoRequest.findOne({
      iaoId: approveIaoRequestDTO.requestId,
      status: IAO_REQUEST_STATUS.APPROVED_A,
    });

    this._validateSecondReviewer(iaoRequest, user);

    const secondReview = this.iaoRequestBuilderService.createSecondReview(
      approveIaoRequestDTO,
      user,
    );

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const updateIaoRequest = await this.dataService.iaoRequest.updateOne(
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
      if (updateIaoRequest.modifiedCount === 0)
        throw 'Cannot approve IAO request';

      // update asset status
      const updateItems = iaoRequest.items.map((item) => {
        return {
          itemId: item,
        };
      });
      const updateAsset = await this.dataService.asset.updateMany(
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
      if (updateAsset.modifiedCount === 0) throw 'Cannot update asset status';

      await session.commitTransaction();
      return approveIaoRequestDTO.requestId;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async firstRejectIaoRequest(
    approveIaoRequestDTO: ApproveIaoRequestDTO,
    user: any,
  ) {
    const iaoRequest = await this.dataService.iaoRequest.findOne({
      iaoId: approveIaoRequestDTO.requestId,
      status: IAO_REQUEST_STATUS.IN_REVIEW,
    });

    this._validateFirstReviewer(iaoRequest, user);

    const firstReview = this.iaoRequestBuilderService.createReject(
      approveIaoRequestDTO,
      user,
    );
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const updateIaoRequest = await this.dataService.iaoRequest.updateOne(
        {
          iaoId: approveIaoRequestDTO.requestId,
          status: IAO_REQUEST_STATUS.IN_REVIEW,
          updatedAt: iaoRequest['updatedAt'],
        },
        {
          $set: {
            firstReviewer: { ...firstReview },
            status: IAO_REQUEST_STATUS.REJECTED,
          },
        },
        { session },
      );
      if (updateIaoRequest.modifiedCount === 0)
        throw 'Cannot reject this IAO request';

      // update asset status
      const updateItems = iaoRequest.items.map((item) => {
        return {
          itemId: item,
        };
      });
      const updateAsset = await this.dataService.asset.updateMany(
        {
          $or: updateItems,
          ownerId: iaoRequest.ownerId,
          status: ASSET_STATUS.IN_REVIEW,
          deleted: false,
        },
        {
          $set: { status: ASSET_STATUS.OPEN },
        },
        { session },
      );
      if (updateAsset.modifiedCount === 0) throw 'Cannot update asset status';

      await session.commitTransaction();
      return approveIaoRequestDTO.requestId;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async secondRejectIaoRequest(
    approveIaoRequestDTO: ApproveIaoRequestDTO,
    user: any,
  ) {
    const iaoRequest = await this.dataService.iaoRequest.findOne({
      iaoId: approveIaoRequestDTO.requestId,
      status: IAO_REQUEST_STATUS.APPROVED_A,
    });

    this._validateSecondReviewer(iaoRequest, user);

    const secondReview = this.iaoRequestBuilderService.createReject(
      approveIaoRequestDTO,
      user,
    );
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const updateIaoRequest = await this.dataService.iaoRequest.updateOne(
        {
          iaoId: approveIaoRequestDTO.requestId,
          status: IAO_REQUEST_STATUS.APPROVED_A,
          updatedAt: iaoRequest['updatedAt'],
        },
        {
          $set: {
            secondReviewer: { ...secondReview },
            status: IAO_REQUEST_STATUS.REJECTED,
          },
        },
        { session },
      );
      if (updateIaoRequest.modifiedCount === 0)
        throw 'Cannot reject this IAO request';

      // update asset status
      const updateItems = iaoRequest.items.map((item) => {
        return {
          itemId: item,
        };
      });
      const updateAsset = await this.dataService.asset.updateMany(
        {
          $or: updateItems,
          ownerId: iaoRequest.ownerId,
          status: ASSET_STATUS.IN_REVIEW,
          deleted: false,
        },
        {
          $set: { status: ASSET_STATUS.OPEN },
        },
        { session },
      );
      if (updateAsset.modifiedCount === 0) throw 'Cannot update asset status';

      await session.commitTransaction();
      return approveIaoRequestDTO.requestId;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  _validateSecondReviewer(iaoRequest: IAORequest, user: any) {
    const rejectRole = [Role.OWNER, Role.SuperAdmin];

    if (!rejectRole.includes(user.role))
      throw 'You do not have permission for this action';
    if (!iaoRequest) throw 'No data exists';
    if (!iaoRequest.firstReviewer) throw 'The first review not exists';
    if (iaoRequest.secondReviewer) {
      if (iaoRequest.secondReviewer.adminId !== user.adminId)
        throw 'This IAO request is approved';
    }

    if (
      iaoRequest.firstReviewer &&
      iaoRequest.firstReviewer.adminId === user.adminId
    )
      throw 'Admin overlaps with first reviewer';
  }

  _validateFirstReviewer(iaoRequest: IAORequest, user: any) {
    if (!iaoRequest) throw 'No data exists';

    const firstApproveRole = [Role.OWNER, Role.SuperAdmin, Role.OperationAdmin];

    if (!firstApproveRole.includes(user.role))
      throw 'You do not have permission for this action';

    if (iaoRequest.firstReviewer) throw 'This IAO request is approved';
  }

  async changeToDraftIaoRequest(dto: ApproveIaoRequestDTO, user: any) {
    const changeToDraftRole = [
      Role.OWNER,
      Role.SuperAdmin,
      Role.OperationAdmin,
    ];
    if (!changeToDraftRole.includes(user.role))
      throw 'You do not have permission for this action';

    const iaoRequest = await this.dataService.iaoRequest.findOne({
      iaoId: dto.requestId,
      status: IAO_REQUEST_STATUS.IN_REVIEW,
    });
    if (!iaoRequest) throw 'No data exists';

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const updateIaoRequest = await this.dataService.iaoRequest.updateOne(
        {
          iaoId: iaoRequest.iaoId,
          ownerId: iaoRequest.ownerId,
          status: IAO_REQUEST_STATUS.IN_REVIEW,
        },
        { $set: { status: IAO_REQUEST_STATUS.DRAFT } },
        { session },
      );
      if (updateIaoRequest.modifiedCount === 0)
        throw 'Cannot change to draft this IAO request';

      // update asset status
      const updateItems = iaoRequest.items.map((item) => {
        return {
          itemId: item,
        };
      });
      const updateAsset = await this.dataService.asset.updateMany(
        {
          $or: updateItems,
          ownerId: iaoRequest.ownerId,
          status: ASSET_STATUS.IN_REVIEW,
          inDraft: false,
          deleted: false,
        },
        {
          $set: { status: ASSET_STATUS.OPEN, inDraft: true },
        },
        { session },
      );
      if (updateAsset.modifiedCount === 0) throw 'Cannot update asset status';

      await session.commitTransaction();
      return iaoRequest.iaoId;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async EditReviewComment(dto: EditReviewComment, user: any) {
    const editCommentRole = [Role.OWNER, Role.SuperAdmin];
    if (!editCommentRole.includes(user.role))
      throw 'You do not have permission for this action';

    const iaoRequest = await this.dataService.iaoRequest.findOne({
      iaoId: dto.requestId,
    });
    if (!iaoRequest) throw 'This IAO request is invalid';
    if (!iaoRequest.firstReviewer) throw 'First review is not exists';
    if (dto.secondComment && !iaoRequest.secondReviewer)
      throw 'Second review is not exists';

    const update = {
      $set: {
        firstReviewer: {
          ...iaoRequest.firstReviewer,
          comment: dto.firstComment,
        },
      },
    };

    if (dto.secondComment && iaoRequest.secondReviewer) {
      update['$set']['secondReviewer'] = {
        ...iaoRequest.secondReviewer,
        comment: dto.secondComment,
      };
    }

    await this.dataService.iaoRequest.updateOne(
      { iaoId: iaoRequest.iaoId },
      { ...update },
    );
    return iaoRequest.iaoId;
  }

  async searchDocument(id: string, filter: FilterDocumentDto) {
    const query = {};
    if (filter.keyword)
      query['$or'] = [
        {
          'documents.name': {
            $regex: Utils.escapeRegex(filter.keyword.trim()),
            $options: 'i',
          },
        },
        {
          'documents.description': {
            $regex: Utils.escapeRegex(filter.keyword.trim()),
            $options: 'i',
          },
        },
        {
          'documents.uploadBy': {
            $regex: Utils.escapeRegex(filter.keyword.trim()),
            $options: 'i',
          },
        },
      ];
    if (filter.display === DISPLAY_STATUS.DISPLAY)
      query['documents.display'] = true;
    if (filter.display === DISPLAY_STATUS.NOT_DISPLAY)
      query['documents.display'] = false;
    const documents = await this.dataService.iaoRequest.aggregate([
      {
        $match: {
          iaoId: id,
        },
      },
      {
        $unwind: { path: '$documents' },
      },
      { $match: query },
      {
        $lookup: {
          from: 'Admin',
          let: { id: '$documents.uploadBy' },
          pipeline: [
            { $match: { $expr: { $eq: ['$adminId', '$$id'] } } },
            {
              $project: {
                email: 1,
                fullname: 1,
              },
            },
          ],
          as: 'documents.uploaderAdmin',
        },
      },
      {
        $unwind: {
          path: '$documents.uploaderAdmin',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: '$_id',
          documents: { $push: '$documents' },
        },
      },
      {
        $project: { _id: 0 },
      },
    ]);
    return documents.length ? documents[0].documents : documents;
  }

  async addDocumentItem(user: any, data: CreateDocumentItemDto, id: string) {
    const filter = {
      iaoId: id,
    };
    const iao = await this.dataService.iaoRequest.findOne(filter);
    if (!iao) throw ApiError('', `Id of IAO is invalid`);

    const fileSize = await ufs(data.fileUrl).catch(console.error);
    if (fileSize > MAX_FILE_SIZE)
      throw ApiError(ErrorCode.MAX_FILE_SIZE, `file name: ${data.name}`);

    //create newDocuments
    const newDoc = await this.iaoRequestBuilderService.createDocumentItem(
      data,
      fileSize,
      user.adminId,
    );

    const newIaoRequest = await this.dataService.iaoRequest.findOneAndUpdate(
      filter,
      {
        $push: {
          documents: {
            $each: [newDoc],
            $position: 0,
          },
        },
        $set: {
          updatedBy: user.adminId,
        },
      },
      { new: true },
    );

    return this.iaoRequestBuilderService.convertDocumentItem(
      newIaoRequest.documents[0],
      user,
    );
  }

  async editDocumentItem(
    user: any,
    id: string,
    docId: string,
    data: UpdateDocumentItemDto,
  ) {
    const filter = {
      iaoId: id,
    };

    const iao = await this.dataService.iaoRequest.findOne(filter);
    if (!iao) throw ApiError('', `Id of IAO request is invalid`);

    const updatedIao = await this.dataService.iaoRequest.findOneAndUpdate(
      {
        iaoId: id,
        updatedAt: iao['updatedAt'],
        'documents._id': docId,
      },
      {
        $set: {
          'documents.$.description': data.description,
          'documents.$.display': data.display,
          updatedBy: user.adminId,
        },
      },
    );

    if (!updatedIao)
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'Cannot edit document');
    return { success: true };
  }

  async deleteDocumentItem(user, id: string, docId: string) {
    const filter = {
      iaoId: id,
    };

    const iao = await this.dataService.iaoRequest.findOne(filter);
    if (!iao) throw ApiError('', `Id of IAO request is invalid`);

    const updatedIao = await this.dataService.iaoRequest.findOneAndUpdate(
      {
        iaoId: id,
        updatedAt: iao['updatedAt'],
        'documents._id': docId,
      },
      {
        $pull: { documents: { _id: docId } },
        $set: {
          updatedBy: user.adminId,
        },
      },
    );
    if (!updatedIao)
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'Cannot delete document');
    return { success: true };
  }
}
