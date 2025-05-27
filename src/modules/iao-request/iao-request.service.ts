import { ForbiddenException, Injectable } from '@nestjs/common';
import { IDataServices } from 'src/core/abstracts/data-services.abstract';
import {
  DetailIAORequestDto,
  FilterIAORequestDto,
} from './dto/filter-iao-request.dto';
import { get } from 'lodash';
import {
  AssetType,
  IAORequest,
  Asset,
  IAO_REQUEST_STATUS,
  ASSET_STATUS,
  NOTIFICATION_SUBTYPE,
  NFT_STATUS,
  F_NFT_MINTED_STATUS,
} from 'src/datalayer/model';
import { IaoRequestBuilderService } from './iao-request.factory.service';
import { ApproveIaoRequestDTO } from './dto/approve-iao-request.dto';
import { Role } from '../auth/role.enum';
import { InjectConnection } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { EditReviewComment } from './dto/edit-review-comment.dto';
import {
  DEFAULT_LIMIT,
  DEFAULT_OFFET,
  ErrorCode,
  LOCALIZATION,
} from 'src/common/constants';
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
import { SocketGateway } from 'src/providers/socket/socket.gateway';
import {
  SOCKET_NAMESPACE,
  SOCKET_NOTIFICATION_EVENT,
} from 'src/providers/socket/socket.enum';
import { MailService } from 'src/services/mail/mail.service';
import { EMAIL_CONFIG } from 'src/common/email-config';
import { EmailService } from 'src/services/email/email.service';
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
    private readonly socketGateway: SocketGateway,
    private readonly mailService: MailService,
    private readonly emailService: EmailService,

    @InjectConnection() private readonly connection: mongoose.Connection,
  ) {}
  async findAll(filter: FilterIAORequestDto, user: any) {
    const query = {};

    let fractorIdList = [];
    if (user.role === Role.FractorBD) {
      fractorIdList = await this.getListFractorId(user.adminId);
      query['ownerId'] = { $in: fractorIdList };
    }

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
      query['submitedAt'] = {
        $gte: filter.submittedFrom,
        $lte: filter.submittedTo,
      };
    } else if (filter.submittedFrom) {
      query['submitedAt'] = {
        $gte: filter.submittedFrom,
      };
    } else if (filter.submittedTo) {
      query['submitedAt'] = {
        $lte: filter.submittedTo,
      };
    }
    if (filter.submittedBy) {
      query['ownerId'] = filter.submittedBy.trim();
    }

    // filter 1st reviewed
    if (filter._1stReviewedFrom && filter._1stReviewedTo) {
      query['firstReviewer.createdAt'] = {
        $gte: filter._1stReviewedFrom,
        $lte: filter._1stReviewedTo,
      };
    } else if (filter._1stReviewedFrom) {
      query['firstReviewer.createdAt'] = {
        $gte: filter._1stReviewedFrom,
      };
    } else if (filter._1stReviewedTo) {
      query['firstReviewer.createdAt'] = {
        $lte: filter._1stReviewedTo,
      };
    }
    if (filter._1stReviewedBy) {
      query['firstReviewer.adminId'] = filter._1stReviewedBy.trim();
    }

    // filter 2st reviewed
    if (filter._2stReviewedFrom && filter._2stReviewedTo) {
      query['firstReviewer.createdAt'] = {
        $gte: filter._2stReviewedFrom,
        $lte: filter._2stReviewedTo,
      };
    } else if (filter._2stReviewedFrom) {
      query['firstReviewer.createdAt'] = {
        $gte: filter._2stReviewedFrom,
      };
    } else if (filter._2stReviewedTo) {
      query['firstReviewer.createdAt'] = {
        $lte: filter._2stReviewedTo,
      };
    }
    if (filter._2stReviewedBy) {
      query['secondReviewer.adminId'] = filter._2stReviewedBy.trim();
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

    const dataReturnFilter = [sort, { $skip: filter.offset || DEFAULT_OFFET }];

    if (filter.limit !== -1)
      dataReturnFilter.push({ $limit: filter.limit || DEFAULT_LIMIT });

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

  async getListFractorId(adminId: string) {
    const agg = [
      {
        $match: { assignedBD: adminId },
      },
      {
        $group: {
          _id: '$assignedBD',
          fractorIds: { $push: '$fractorId' },
        },
      },
    ];
    const listFractor = await this.dataService.fractor.aggregate(agg, {
      collation: { locale: 'en' },
    });
    return listFractor.length ? listFractor[0].fractorIds : [];
  }

  async findOne(
    id: string,
    user: any,
    filter: DetailIAORequestDto,
  ): Promise<IAORequest> {
    const query = { iaoId: id };

    let fractorIdList = [];
    if (user.role === Role.FractorBD) {
      fractorIdList = await this.getListFractorId(user.adminId);
      query['ownerId'] = { $in: fractorIdList };
      const iao = await this.dataService.iaoRequest.findOne(query);
      if (!iao) throw new ForbiddenException('Forbidden');
    }

    const agg = [];

    agg.push(
      {
        $match: query,
      },
      {
        $unwind: {
          path: '$documents',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'Admin',
          let: { id: '$documents.uploadBy' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$adminId', '$$id'] },
              },
            },
            {
              $project: {
                _id: 0,
                adminId: 1,
                fullname: 1,
              },
            },
          ],
          as: 'documents.uploadByAdmin',
        },
      },
      {
        $unwind: {
          path: '$documents.uploadByAdmin',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: '$_id',
          documents: {
            $push: '$documents',
          },
        },
      },
      {
        $lookup: {
          from: 'IAORequest',
          localField: '_id',
          foreignField: '_id',
          as: 'iaoDetail',
        },
      },
      {
        $unwind: {
          path: '$iaoDetail',
        },
      },
      {
        $addFields: {
          'iaoDetail.documents': '$documents',
        },
      },
      {
        $replaceRoot: {
          newRoot: '$iaoDetail',
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
            {
              $project: {
                _id: 1,
                fullname: 1,
                fractorId: 1,
                assignedBD: 1,
                kycStatus: 1,
              },
            },
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
          let: { adminId: '$fractor.assignedBD' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$adminId', '$$adminId'] },
              },
            },
            { $project: { _id: 1, fullname: 1, adminId: 1 } },
          ],
          as: 'bds',
        },
      },
      {
        $addFields: {
          bd: { $arrayElemAt: ['$bds', 0] },
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
        $addFields: {
          sizeOfItem: { $size: '$items' },
        },
      },
      {
        $unwind: {
          path: '$items',
          preserveNullAndEmptyArrays: true,
        },
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
                custodianship: 1,
                isMintNFT: 1,
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
    //15/02: wrong logic when re-create iao request from iao event failed
    // if (filter.isGetNft) {
    //   agg.push(
    //     {
    //       $lookup: {
    //         from: 'Nft',
    //         let: { itemId: '$items' },
    //         pipeline: [
    //           {
    //             $match: {
    //               $expr: { $eq: ['$assetId', '$$itemId'] },
    //               deleted: false,
    //             },
    //           },
    //           {
    //             $project: {
    //               assetCategory: 1,
    //               name: 1,
    //               tokenId: 1,
    //               mediaUrl: 1,
    //               status: 1,
    //             },
    //           },
    //         ],
    //         as: 'nfts',
    //       },
    //     },
    //     {
    //       $addFields: {
    //         nft: { $arrayElemAt: ['$nfts', 0] },
    //       },
    //     },
    //     {
    //       $addFields: {
    //         itemDetail: {
    //           _id: '$item._id',
    //           itemId: '$item.itemId',
    //           name: '$item.name',
    //           media: '$item.media',
    //           status: '$item.status',
    //           nftName: '$nft.name',
    //           tokenId: '$nft.tokenId',
    //           nftMedia: '$nft.mediaUrl',
    //           nftStatus: '$nft.status',
    //           assetCategory: '$nft.assetCategory',
    //           isMintNFT: '$item.isMintNFT',
    //           documents: '$item.documents',
    //           category: '$assetType.category',
    //           type: '$assetType.name',
    //           custodianship: '$item.custodianship',
    //         },
    //       },
    //     },
    //   );
    // } else {
    //   agg.push({
    //     $addFields: {
    //       itemDetail: {
    //         _id: '$item._id',
    //         itemId: '$item.itemId',
    //         name: '$item.name',
    //         media: '$item.media',
    //         status: '$item.status',
    //         documents: '$item.documents',
    //         category: '$assetType.category',
    //         type: '$assetType.name',
    //         custodianship: '$item.custodianship',
    //         isMintNFT: '$item.isMintNFT',
    //       },
    //     },
    //   });
    // }
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
          custodianship: '$item.custodianship',
          isMintNFT: '$item.isMintNFT',
        },
      },
    });

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
        bd: { $first: '$bd' },
        iaoEventId: { $first: '$iaoEventId' },
        iaoId: { $first: '$iaoId' },
      },
    });

    const iaos = await this.dataService.iaoRequest.aggregate(agg);

    if (iaos.length === 0)
      throw ApiError(ErrorCode.NO_DATA_EXISTS, 'No data exists');
    if (iaos[0].updatedBy) {
      const admin = await this.dataService.admin.findOne({
        adminId: iaos[0].updatedBy,
      });
      const fractor = await this.dataService.fractor.findOne({
        fractorId: iaos[0].updatedBy,
      });
      const updatedBy = {
        fractorId: admin ? admin.adminId : fractor.fractorId,
        fullname: admin ? admin.fullname : fractor.fullname,
      };
      iaos[0].updatedBy = updatedBy;
    }

    // get F-NFT information
    const fNFT = await this.dataService.fnft.findOne({
      iaoRequestId: iaos[0]?.iaoId,
      mintedStatus: F_NFT_MINTED_STATUS.MINTED,
    });
    iaos[0].fNFTContractAddress = fNFT?.contractAddress;

    //15/02: check return null nft if nft is in old iao event
    if (!iaos[0]?.iaoEventId) {
      const itemIds = iaos[0].items.map((item) => {
        return item.itemId;
      });
      const nfts = await this.dataService.nft.findMany({
        assetId: { $in: itemIds },
        inIaoEventOnChain: false,
        status: { $in: [NFT_STATUS.MINTED, NFT_STATUS.DRAFT] },
        deleted: false,
      });
      if (nfts.length > 0) {
        for (const item of iaos[0].items) {
          const nft = nfts.find((e) => e.assetId === item.itemId);
          item.nftName = nft?.name;
          item.tokenId = nft?.tokenId;
          item.nftMedia = nft?.mediaUrl;
          item.nftStatus = nft?.status;
          item.assetCategory = nft?.assetCategory;
        }
      }
    } else {
      // have iao event created on chain -> get nft of old iao event
      const oldIaoEvent = await this.dataService.iaoEvent.aggregate([
        {
          $match: {
            iaoEventId: iaos[0]?.iaoEventId,
          },
        },
        {
          $lookup: {
            from: 'Fnft',
            localField: 'FNFTcontractAddress',
            foreignField: 'contractAddress',
            as: 'FNFT',
          },
        },
        {
          $unwind: {
            path: '$FNFT',
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $lookup: {
            from: 'Nft',
            localField: 'FNFT.items',
            foreignField: 'tokenId',
            as: 'NFTs',
          },
        },
        {
          $project: { NFTs: 1 },
        },
      ]);
      for (const item of iaos[0].items) {
        const nft = oldIaoEvent[0].NFTs.find((e) => e.assetId === item.itemId);
        item.nftName = nft?.name;
        item.tokenId = nft?.tokenId;
        item.nftMedia = nft?.mediaUrl;
        item.nftStatus = nft?.status;
        item.assetCategory = nft?.assetCategory;
      }
    }
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
        firstReviewer: { ...firstReview },
        status: IAO_REQUEST_STATUS.APPROVED_A,
        updatedBy: user.adminId,
      },
    );
    if (updateIaoRequest.modifiedCount === 0)
      throw ApiError(ErrorCode.NO_DATA_EXISTS, 'Cannot approve IAO request');
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
          secondReviewer: { ...secondReview },
          status: IAO_REQUEST_STATUS.APPROVED_B,
          updatedBy: user.adminId,
        },
        { session },
      );
      if (updateIaoRequest.modifiedCount === 0)
        throw ApiError(ErrorCode.NO_DATA_EXISTS, 'Cannot approve IAO request');

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
          status: ASSET_STATUS.IAO_APPROVED,
          lastUpdatedBy: user.adminId,
        },
        { session },
      );
      await session.commitTransaction();

      const fractor = await this.dataService.fractor.findOne({
        fractorId: iaoRequest.ownerId,
      });
      if (fractor.notificationSettings?.iaoRequestResult) {
        // notification
        await this.notificationIAORequest(
          iaoRequest,
          SOCKET_NOTIFICATION_EVENT.ADMIN_APPROVED_IAO_REQUEST,
          NOTIFICATION_SUBTYPE.SECOND_APPROVED_IAO_REQUEST,
          session,
        );
        // send mail
        if (fractor.email) {
          const data = this.createTemplateApproveIaoRequest(
            fractor.email,
            iaoRequest.iaoId,
            iaoRequest['_id'],
            fractor.localization,
          );
          await this.emailService.addQueue(data);
        }
      }

      return approveIaoRequestDTO.requestId;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  createTemplateApproveIaoRequest(email, iaoRequestId, _id, localization) {
    let template = EMAIL_CONFIG.DIR.SECOND_APPROVED_IAO_REQUEST.EN;
    let subject = EMAIL_CONFIG.TITLE.SECOND_APPROVED_IAO_REQUEST.EN;
    const iaoRequestDetailUrl = `${process.env.FRACTOR_DOMAIN}/${localization}/request-iao/${_id}`;

    if (localization === LOCALIZATION.CN) {
      template = EMAIL_CONFIG.DIR.SECOND_APPROVED_IAO_REQUEST.CN;
      subject = EMAIL_CONFIG.TITLE.SECOND_APPROVED_IAO_REQUEST.CN;
    }
    if (localization === LOCALIZATION.JP) {
      template = EMAIL_CONFIG.DIR.SECOND_APPROVED_IAO_REQUEST.JA;
      subject = EMAIL_CONFIG.TITLE.SECOND_APPROVED_IAO_REQUEST.JP;
    }
    if (localization === LOCALIZATION.VN) {
      template = EMAIL_CONFIG.DIR.SECOND_APPROVED_IAO_REQUEST.VI;
      subject = EMAIL_CONFIG.TITLE.SECOND_APPROVED_IAO_REQUEST.VN;
    }
    return {
      to: email,
      from: { name: EMAIL_CONFIG.FROM_EMAIL, address: process.env.MAIL_FROM },
      subject,
      template,
      context: {
        iaoRequestId,
        iaoRequestDetailUrl,
        contactUs: `${process.env.FRACTOR_DOMAIN}/${localization}/contact-us`,
        localization: localization,
      },
    };
  }

  createTemplateRejectIaoRequest(email, iaoRequestId, _id, localization) {
    let template = EMAIL_CONFIG.DIR.REJECT_IAO_REQUEST.EN;
    let subject = EMAIL_CONFIG.TITLE.REJECT_IAO_REQUEST.EN;
    const iaoRequestDetailUrl = `${process.env.FRACTOR_DOMAIN}/${localization}/request-iao/${_id}`;
    const contactUs = `${process.env.FRACTOR_DOMAIN}/${localization}/contact-us`;

    if (localization === LOCALIZATION.CN) {
      template = EMAIL_CONFIG.DIR.REJECT_IAO_REQUEST.CN;
      subject = EMAIL_CONFIG.TITLE.REJECT_IAO_REQUEST.CN;
    }
    if (localization === LOCALIZATION.JP) {
      template = EMAIL_CONFIG.DIR.REJECT_IAO_REQUEST.JA;
      subject = EMAIL_CONFIG.TITLE.REJECT_IAO_REQUEST.JP;
    }
    if (localization === LOCALIZATION.VN) {
      template = EMAIL_CONFIG.DIR.REJECT_IAO_REQUEST.VI;
      subject = EMAIL_CONFIG.TITLE.REJECT_IAO_REQUEST.VN;
    }
    return {
      to: email,
      from: { name: EMAIL_CONFIG.FROM_EMAIL, address: process.env.MAIL_FROM },
      subject,
      template,
      context: {
        iaoRequestId,
        iaoRequestDetailUrl,
        contactUs: contactUs,
      },
    };
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
          firstReviewer: { ...firstReview },
          status: IAO_REQUEST_STATUS.REJECTED,
          updatedBy: user.adminId,
        },
        { session },
      );
      if (updateIaoRequest.modifiedCount === 0)
        throw ApiError(
          ErrorCode.NO_DATA_EXISTS,
          'Cannot reject this IAO request',
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
          status: ASSET_STATUS.OPEN,
          lastUpdatedBy: user.adminId,
        },
        { session },
      );
      await session.commitTransaction();

      const fractor = await this.dataService.fractor.findOne({
        fractorId: iaoRequest.ownerId,
      });
      if (fractor.notificationSettings?.iaoRequestResult) {
        // notification
        await this.notificationIAORequest(
          iaoRequest,
          SOCKET_NOTIFICATION_EVENT.ADMIN_REJECT_IAO_REQUEST,
          NOTIFICATION_SUBTYPE.REJECT_IAO_REQUEST,
          session,
        );
        // send mail

        if (fractor.email) {
          const data = this.createTemplateRejectIaoRequest(
            fractor.email,
            iaoRequest.iaoId,
            iaoRequest['_id'],
            fractor.localization,
          );
          await this.emailService.addQueue(data);
        }
      }

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
    });

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
          updatedAt: iaoRequest['updatedAt'],
        },
        {
          secondReviewer: { ...secondReview },
          status: IAO_REQUEST_STATUS.REJECTED,
          updatedBy: user.adminId,
        },
        { session },
      );
      if (updateIaoRequest.modifiedCount === 0)
        throw ApiError(
          ErrorCode.NO_DATA_EXISTS,
          'Cannot reject this IAO request',
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
          deleted: false,
        },
        {
          status: ASSET_STATUS.OPEN,
          lastUpdatedBy: user.adminId,
        },
        { session },
      );
      await session.commitTransaction();

      const fractor = await this.dataService.fractor.findOne({
        fractorId: iaoRequest.ownerId,
      });
      if (fractor.notificationSettings?.iaoRequestResult) {
        // notification
        await this.notificationIAORequest(
          iaoRequest,
          SOCKET_NOTIFICATION_EVENT.ADMIN_REJECT_IAO_REQUEST,
          NOTIFICATION_SUBTYPE.REJECT_IAO_REQUEST,
          session,
        );
        // send mail

        if (fractor.email) {
          const data = this.createTemplateRejectIaoRequest(
            fractor.email,
            iaoRequest.iaoId,
            iaoRequest['_id'],
            fractor.localization,
          );
          await this.emailService.addQueue(data);
        }
      }

      return approveIaoRequestDTO.requestId;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async notificationIAORequest(iaoRequest, event, subtype, session) {
    // notification
    let notification: any = await this.dataService.notification.create(
      this.iaoRequestBuilderService.createNotification(
        iaoRequest.ownerId,
        iaoRequest['_id'],
        iaoRequest.iaoId,
        subtype,
      ),
      session,
    );
    notification = notification[0];
    // socket
    this.socketGateway.sendNotification(
      SOCKET_NAMESPACE.IAO_REQUEST_REVIEW_RESULT,
      `${event}_${iaoRequest.ownerId}`,
      notification,
    );
  }

  _validateSecondReviewer(iaoRequest: IAORequest, user: any) {
    const rejectRole = [Role.OWNER, Role.SuperAdmin];

    if (!rejectRole.includes(user.role))
      throw ApiError(
        ErrorCode.NO_DATA_EXISTS,
        'You do not have permission for this action',
      );
    if (!iaoRequest)
      throw ApiError(
        ErrorCode.NO_DATA_EXISTS,
        'IAO request has been approved by another Admin',
      );
    if (!iaoRequest.firstReviewer)
      throw ApiError(ErrorCode.NO_DATA_EXISTS, 'The first review not exists');
    if (iaoRequest.secondReviewer) {
      if (iaoRequest.secondReviewer.adminId !== user.adminId)
        throw ApiError(
          ErrorCode.NO_DATA_EXISTS,
          'This IAO request is approved',
        );
    }

    if (
      iaoRequest.firstReviewer &&
      iaoRequest.firstReviewer.adminId === user.adminId
    )
      throw ApiError(
        ErrorCode.NO_DATA_EXISTS,
        'Admin overlaps with first reviewer',
      );
  }

  _validateFirstReviewer(iaoRequest: IAORequest, user: any) {
    if (!iaoRequest)
      throw ApiError(
        ErrorCode.NO_DATA_EXISTS,
        'IAO request has been approved by another Admin',
      );

    const firstApproveRole = [Role.OWNER, Role.SuperAdmin, Role.OperationAdmin];

    if (!firstApproveRole.includes(user.role))
      throw ApiError(
        ErrorCode.NO_DATA_EXISTS,
        'You do not have permission for this action',
      );

    if (iaoRequest.firstReviewer)
      throw ApiError(ErrorCode.NO_DATA_EXISTS, 'This IAO request is approved');
  }

  async changeToDraftIaoRequest(dto: ApproveIaoRequestDTO, user: any) {
    const changeToDraftRole = [
      Role.OWNER,
      Role.SuperAdmin,
      Role.OperationAdmin,
    ];
    if (!changeToDraftRole.includes(user.role))
      throw ApiError(
        ErrorCode.NO_DATA_EXISTS,
        'You do not have permission for this action',
      );

    const iaoRequest = await this.dataService.iaoRequest.findOne({
      iaoId: dto.requestId,
      status: IAO_REQUEST_STATUS.IN_REVIEW,
    });
    if (!iaoRequest) throw ApiError(ErrorCode.NO_DATA_EXISTS, 'No data exists');

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const updateIaoRequest = await this.dataService.iaoRequest.updateOne(
        {
          iaoId: iaoRequest.iaoId,
          ownerId: iaoRequest.ownerId,
          status: IAO_REQUEST_STATUS.IN_REVIEW,
        },
        {
          status: IAO_REQUEST_STATUS.DRAFT,
          updatedBy: user.adminId,
          submitedAt: null,
        },
        { session },
      );
      if (updateIaoRequest.modifiedCount === 0)
        throw ApiError(
          ErrorCode.NO_DATA_EXISTS,
          'Cannot change to draft this IAO request',
        );

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
          status: ASSET_STATUS.OPEN,
          inDraft: true,
          lastUpdatedBy: user.adminId,
        },
        { session },
      );
      if (updateAsset.modifiedCount === 0)
        throw ApiError(ErrorCode.NO_DATA_EXISTS, 'Cannot update asset status');

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
      throw ApiError(
        ErrorCode.NO_DATA_EXISTS,
        'You do not have permission for this action',
      );

    const iaoRequest = await this.dataService.iaoRequest.findOne({
      iaoId: dto.requestId,
    });
    if (!iaoRequest)
      throw ApiError(ErrorCode.NO_DATA_EXISTS, 'This IAO request is invalid');
    if (!iaoRequest.firstReviewer)
      throw ApiError(ErrorCode.NO_DATA_EXISTS, 'First review is not exists');
    if (dto.secondComment && !iaoRequest.secondReviewer)
      throw ApiError(ErrorCode.NO_DATA_EXISTS, 'Second review is not exists');
    if (
      iaoRequest.firstReviewer.status === IAO_REQUEST_STATUS.REJECTED &&
      dto.firstComment.trim() === ''
    ) {
      throw ApiError(
        ErrorCode.NO_DATA_EXISTS,
        'First comment should not be empty',
      );
    }
    if (
      iaoRequest.secondReviewer?.status === IAO_REQUEST_STATUS.REJECTED &&
      dto.secondComment?.trim() === ''
    ) {
      throw ApiError(
        ErrorCode.NO_DATA_EXISTS,
        'Second comment should not be empty',
      );
    }
    let update = {};
    if (
      dto.firstComment &&
      dto.firstComment !== iaoRequest.firstReviewer.comment
    ) {
      update = {
        firstReviewer: {
          ...iaoRequest.firstReviewer,
          comment: dto.firstComment,
        },
        updatedBy: user.adminId,
      };
    }

    if (
      dto.secondComment &&
      iaoRequest.secondReviewer &&
      dto.secondComment !== iaoRequest.secondReviewer.comment
    ) {
      update['secondReviewer'] = {
        ...iaoRequest.secondReviewer,
        comment: dto.secondComment,
      };
      update['updatedBy'] = user.adminId;
    }

    await this.dataService.iaoRequest.updateOne(
      { iaoId: iaoRequest.iaoId },
      update,
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

    if (!updatedIao) throw ApiError(ErrorCode.DEFAULT_ERROR, 'File is deleted');
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
    if (!updatedIao) throw ApiError(ErrorCode.DEFAULT_ERROR, 'File is deleted');
    return { success: true };
  }
}
