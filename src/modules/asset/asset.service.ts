import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { get, isEqual } from 'lodash';
import mongoose from 'mongoose';
import { ApiError } from 'src/common/api';
import { ListDocument } from 'src/common/common-type';
import { ErrorCode } from 'src/common/constants';
import { IDataServices } from 'src/core/abstracts/data-services.abstract';
import {
  CategoryType,
  IAO_REQUEST_STATUS,
  MAX_PHOTOS,
  MIN_PHOTOS,
  NFT_STATUS,
} from 'src/datalayer/model';
import {
  ASSET_STATUS,
  CUSTODIANSHIP_STATUS,
  MEDIA_TYPE,
  REVIEW_STATUS,
} from 'src/datalayer/model/asset.model';
import {
  DOCUMENT_STATUS,
  MAX_FILE_SIZE,
} from 'src/datalayer/model/document-item.model';
import { AssetBuilderService } from './asset.factory.service';
import {
  CreateDocumentItemDto,
  UpdateDocumentItemDto,
} from './dto/documentItem.dto';
import { FilterAssetDto, IS_CONVERTED_TO_NFT } from './dto/filter-asset.dto';
import {
  DISPLAY_STATUS,
  FilterDocumentDto,
  GetDetailAssetDto,
} from './dto/filter-document.dto';
import { Role } from 'src/modules/auth/role.enum';
import { Utils } from 'src/common/utils';
import { EditDepositedNftDto } from './dto/edit-deposited-nft.dto';
import { UpdateCustodianshipFile } from './dto/edit-file.dto';
import { CUSTODIANSHIP_DISPLAY, UpdateCustodianshipDto } from './dto/update-custodianship-status.dto';
import {
  CreateShipmentInfoDto,
  UpdateShipmentInfoDto,
} from './dto/shipment-infor.dto';
const ufs = require('url-file-size');

@Injectable()
export class AssetService {
  private readonly logger = new Logger(AssetService.name);

  constructor(
    private readonly dataServices: IDataServices,
    private readonly assetBuilderService: AssetBuilderService,
    @InjectConnection() private readonly connection: mongoose.Connection,
  ) {}

  _validatePhoto(dto: any) {
    const photo = dto.media.filter((obj) => obj.type === MEDIA_TYPE.PHOTO);
    if (photo.length < MIN_PHOTOS)
      throw ApiError(ErrorCode.MIN_PHOTOS, `upload least ${MIN_PHOTOS} photo`);
    if (photo.length > MAX_PHOTOS)
      throw ApiError('', `you can upload ${MAX_PHOTOS} photos`);
  }

  _validateSpecifications(dto: any, specifications: any): boolean {
    if (dto.specifications.length !== specifications.length) return false;

    for (let i = 0; i < dto.specifications.length; i++) {
      if (
        !isEqual(
          dto.specifications[i]._id.toString(),
          specifications[i]._id.toString(),
        ) ||
        !isEqual(
          JSON.stringify(dto.specifications[i].label),
          JSON.stringify(specifications[i].label),
        ) ||
        !isEqual(
          JSON.stringify(dto.specifications[i].description),
          JSON.stringify(specifications[i].description),
        ) ||
        !isEqual(
          JSON.stringify(dto.specifications[i].placeholder),
          JSON.stringify(specifications[i].placeholder),
        ) ||
        !isEqual(dto.specifications[i].required, specifications[i].required)
      ) {
        return false;
      }
    }

    return true;
  }

  async getListAsset(filter: FilterAssetDto, user: any) {
    const query: any = {
      deleted: false,
    };
    if (filter.status) {
      query['status'] = filter.status;
    }
    if (
      filter.custodianshipStatus ||
      filter.custodianshipStatus === CUSTODIANSHIP_STATUS.FRACTOR
    )
      query['custodianship.status'] = filter.custodianshipStatus;
    if (filter.keyword) {
      query['$or'] = [
        {
          name: {
            $regex: Utils.escapeRegex(filter.keyword.trim()),
            $options: 'i',
          },
        },
        {
          itemId: {
            $regex: Utils.escapeRegex(filter.keyword.trim()),
            $options: 'i',
          },
        },
        {
          category: {
            $regex: Utils.escapeRegex(filter.keyword.trim()),
            $options: 'i',
          },
        },
        {
          'assetTypeName.en': {
            $regex: Utils.escapeRegex(filter.keyword.trim()),
            $options: 'i',
          },
        },
      ];
    }
    if (filter.owner) {
      query['ownerId'] = filter.owner.trim();
    }
    if (filter.fromDate) {
      query['$and'] = [{ createdAt: { $gte: new Date(filter.fromDate) } }];
    }

    if (filter.toDate) {
      if (query['$and'])
        query['$and'].push({
          createdAt: {
            $lte: new Date(filter.toDate),
          },
        });
      else
        query['$and'] = [
          {
            createdAt: {
              $lte: new Date(filter.toDate),
            },
          },
        ];
    }
    if (filter.isConvertedToNft === IS_CONVERTED_TO_NFT.YES)
      query['isConvertedToNft'] = true;
    if (filter.isConvertedToNft === IS_CONVERTED_TO_NFT.NO)
      query['isConvertedToNft'] = false;

    const agg = [];
    agg.push(
      {
        $lookup: {
          from: 'Fractor',
          localField: 'ownerId',
          foreignField: 'fractorId',
          as: 'Fractor',
        },
      },
      {
        $lookup: {
          from: 'AssetType',
          localField: 'typeId',
          foreignField: '_id',
          as: 'AssetType',
        },
      },
      {
        $addFields: {
          assetTypeName: { $arrayElemAt: ['$AssetType.name', 0] },
        },
      },
      {
        $lookup: {
          from: 'Nft',
          let: { itemId: '$itemId' },
          pipeline: [
            {
              $match: {
                status: {
                  $in: [NFT_STATUS.DRAFT, NFT_STATUS.MINTED],
                },
                $expr: {
                  $eq: ['$assetId', '$$itemId'],
                },
                deleted: false,
              },
            },
          ],
          as: 'nft',
        },
      },
      {
        $addFields: {
          isConvertedToNft: {
            $switch: {
              branches: [{ case: { $gt: [{ $size: '$nft' }, 0] }, then: true }],
              default: false,
            },
          },
        },
      },
      {
        $match: query,
      },
      {
        $project: { specifications: 0 },
      },
    );
    let sort: any = { $sort: {} };
    if (filter.sortField && filter.sortType) {
      sort['$sort'][filter.sortField] = filter.sortType;
    } else {
      sort = { $sort: { createdAt: -1 } };
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
    let dataQuery;
    if (user.role === Role.FractorBD) {
      dataQuery = await this.dataServices.fractor.aggregate(
        [
          {
            $match: {
              assignedBD: user.adminId,
            },
          },
          {
            $unwind: { path: '$collections' },
          },

          {
            $lookup: {
              from: 'Asset',
              localField: 'collections._id',
              foreignField: 'collectionId',
              as: 'asset',
            },
          },
          { $unwind: { path: '$asset' } },
          {
            $lookup: {
              from: 'AssetType',
              localField: 'asset.typeId',
              foreignField: '_id',
              as: 'AssetType',
            },
          },

          {
            $project: {
              _id: '$asset._id',
              name: '$asset.name',
              category: '$asset.category',
              isMintNFT: '$asset.isMintNFT',
              ownershipPrivacy: '$asset.ownershipPrivacy',
              description: '$asset.description',
              status: '$asset.status',
              media: '$asset.media',
              ownerId: '$asset.ownerId',
              collectionId: '$asset.collectionId',
              documents: '$asset.documents',
              deleted: '$asset.deleted',
              inDraft: '$asset.inDraft',
              custodianship: '$custodianship',
              AssetType: '$AssetType',
              itemId: '$asset.itemId',
              createdAt: '$asset.createdAt',
              assetTypeName: { $arrayElemAt: ['$AssetType.name', 0] },
              Fractor: [
                {
                  fullname: '$fullname',
                  email: '$email',
                  kycStatus: '$kycStatus',
                  avatar: '$avatar',
                  _id: '$_id',
                },
              ],
            },
          },
          {
            $match: query,
          },
          {
            $facet: {
              count: [{ $count: 'count' }],
              data: dataReturnFilter,
            },
          },
        ],
        {
          collation: { locale: 'en' },
        },
      );
    } else {
      dataQuery = await this.dataServices.asset.aggregate(agg, {
        collation: { locale: 'en' },
      });
    }
    const data = get(dataQuery, [0, 'data']);
    const response = this.assetBuilderService.convertAssets(data);
    const count = get(dataQuery, [0, 'count', 0, 'count']) || 0;
    return {
      totalDocs: count,
      docs: response || [],
    } as ListDocument;
  }

  async getDetail(assetId: string, query: GetDetailAssetDto) {
    const currentAssetDocument = await this.searchDocument(assetId, {});

    const [currentAsset] = await this.dataServices.asset.aggregate([
      {
        $match: {
          itemId: assetId,
        },
      },
      {
        $unwind: {
          path: '$documentActivityLog',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'Admin',
          let: { id: '$documentActivityLog.adminId' },
          pipeline: [
            { $match: { $expr: { $eq: ['$adminId', '$$id'] } } },
            {
              $project: {
                _id: 0,
                adminId: 1,
                fullname: 1,
              },
            },
          ],
          as: 'documentActivityLog.admin',
        },
      },
      {
        $unwind: {
          path: '$documentActivityLog.admin',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: '$_id',
          documentActivityLog: {
            $push: '$documentActivityLog',
          },
        },
      },
      {
        $lookup: {
          from: 'Asset',
          localField: '_id',
          foreignField: '_id',
          as: 'assetDetail',
        },
      },
      {
        $unwind: {
          path: '$assetDetail',
        },
      },
      {
        $addFields: {
          'assetDetail.documentActivityLog': '$documentActivityLog',
        },
      },
      {
        $replaceRoot: {
          newRoot: '$assetDetail',
        },
      },
      {
        $lookup: {
          from: 'Fractor',
          let: { id: '$lastUpdatedBy' },
          pipeline: [
            { $match: { $expr: { $eq: ['$fractorId', '$$id'] } } },
            {
              $project: {
                fullname: 1,
              },
            },
          ],
          as: 'updatedBy.fractor',
        },
      },
      {
        $lookup: {
          from: 'Admin',
          let: { id: '$lastUpdatedBy' },
          pipeline: [
            { $match: { $expr: { $eq: ['$adminId', '$$id'] } } },
            {
              $project: {
                fullname: 1,
              },
            },
          ],
          as: 'updatedBy.admin',
        },
      },
      {
        $unwind: {
          path: '$updatedBy.fractor',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: { path: '$updatedBy.admin', preserveNullAndEmptyArrays: true },
      },
    ]);
    if (!currentAsset)
      throw ApiError(ErrorCode.NO_DATA_EXISTS, 'no data exists');

    const currentUser = await this.dataServices.fractor.findOne({
      fractorId: currentAsset.ownerId,
    });

    if (!currentUser) throw ApiError(ErrorCode.DEFAULT_ERROR, 'DEFAULT_ERROR');

    const currentAssetType = await this.dataServices.assetTypes.getById(
      currentAsset.typeId,
    );
    if (!currentAssetType)
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'DEFAULT_ERROR');

    //16/02: fix link iao request folow nft token id
    let currentIaoRequest = null;
    if (!!query?.nftId) {
      const fNFT = await this.dataServices.fnft.findOne({
        items: query.nftId,
      });
      if (fNFT) {
        currentIaoRequest = await this.dataServices.iaoRequest.findOne({
          iaoId: fNFT.iaoRequestId,
        });
      } else {
        currentIaoRequest = await this.dataServices.iaoRequest.findOne({
          status: IAO_REQUEST_STATUS.APPROVED_B,
          items: currentAsset.itemId,
        });
      }
    } else {
      currentIaoRequest = await this.dataServices.iaoRequest.findOne({
        items: currentAsset.itemId,
        status: IAO_REQUEST_STATUS.APPROVED_B,
      });
    }

    const currentRedemptionRequest =
      await this.dataServices.redemptionRequest.findOne({
        items: currentAsset.itemId,
      });
    const response = this.assetBuilderService.convertAssetDetail(
      currentAsset,
      currentUser,
      currentAssetType,
      currentAssetDocument,
      currentIaoRequest,
      currentRedemptionRequest,
    );
    return response;
  }

  async editDisplay(assetId: string, user: any) {
    await this.dataServices.asset.findOneAndUpdate(
      {
        _id: assetId,
      },
      [
        {
          $set: { hidden: { $not: '$hidden' }, lastUpdatedBy: user.adminId },
        },
      ],
    );

    return { success: true };
  }

  async searchDocument(assetId: string, filter: FilterDocumentDto) {
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
    const documents = await this.dataServices.asset.aggregate([
      {
        $match: {
          itemId: assetId,
        },
      },
      {
        $unwind: { path: '$documents' },
      },
      { $match: query },
      {
        $lookup: {
          from: 'Fractor',
          let: { id: '$documents.uploadBy' },
          pipeline: [
            { $match: { $expr: { $eq: ['$fractorId', '$$id'] } } },
            {
              $project: {
                email: 1,
                fullname: 1,
              },
            },
          ],
          as: 'documents.uploaderFractor',
        },
      },
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
          path: '$documents.uploaderFractor',
          preserveNullAndEmptyArrays: true,
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

  async addDocumentItem(
    user: any,
    data: CreateDocumentItemDto,
    assetId: string,
  ) {
    const filter = {
      _id: assetId,
      deleted: false,
    };

    const asset = await this.dataServices.asset.findOne(filter);
    if (!asset) throw ApiError('', `Id of Asset is invalid`);

    const fileSize = await ufs(data.fileUrl).catch(console.error);
    if (fileSize > MAX_FILE_SIZE)
      throw ApiError(ErrorCode.MAX_FILE_SIZE, `file name: ${data.name}`);

    //create newDocuments
    const status =
      asset.status >= ASSET_STATUS.CONVERTED_TO_NFT
        ? DOCUMENT_STATUS.NEWLY_UPLOADED
        : DOCUMENT_STATUS.NONE;
    const newDoc = await this.assetBuilderService.createDocumentItem(
      data,
      fileSize,
      user.adminId,
      status,
    );

    const newAsset = await this.dataServices.asset.findOneAndUpdate(
      filter,
      {
        $push: {
          documents: {
            $each: [newDoc],
            $position: 0,
          },
        },
        $set: {
          lastUpdatedBy: user.adminId,
        },
      },
      { new: true },
    );

    return this.assetBuilderService.convertDocumentItem(
      newAsset.documents[0],
      user,
    );
  }

  async editDocumentItem(
    user: any,
    assetId: string,
    docId: string,
    data: UpdateDocumentItemDto,
  ) {
    const filter = {
      itemId: assetId,
    };

    const asset = await this.dataServices.asset.findOne(filter);
    if (!asset) throw ApiError('', `Id of Asset is invalid`);
    const doc = asset.documents.find((doc) => doc['_id'].toString() === docId);
    let status = doc.status;
    if (asset.status >= ASSET_STATUS.CONVERTED_TO_NFT) {
      if (doc.description !== data.description) {
        status = DOCUMENT_STATUS.UPDATE_DESCRIPTION;
      } else if (doc.display !== data.display && data.display === true) {
        status = DOCUMENT_STATUS.UPDATE_DISPLAY;
      } else if (doc.display !== data.display && data.display === false) {
        status = DOCUMENT_STATUS.UPDATE_HIDDEN;
      }
    }
    const updatedAsset = await this.dataServices.asset.findOneAndUpdate(
      {
        itemId: assetId,
        updatedAt: asset['updatedAt'],
        'documents._id': docId,
      },
      {
        $set: {
          'documents.$.description': data.description,
          'documents.$.display': data.display,
          lastUpdatedBy: user.adminId,
          'documents.$.status': status,
        },
      },
    );
    if (!updatedAsset)
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'Cannot edit document');
    return { success: true };
  }

  async deleteDocumentItem(user, assetId: string, docId: string) {
    const filter = {
      itemId: assetId,
    };

    const asset = await this.dataServices.asset.findOne(filter);
    if (!asset) throw ApiError('', `Id of Asset is invalid`);

    let updatedAsset;
    if (asset.status >= ASSET_STATUS.CONVERTED_TO_NFT) {
      const doc = asset.documents.find(
        (doc) => doc['_id'].toString() === docId,
      );
      let display = false;
      if (doc?.ipfsCid) {
        display = doc.display;
      }
      updatedAsset = await this.dataServices.asset.findOneAndUpdate(
        {
          itemId: assetId,
          updatedAt: asset['updatedAt'],
          'documents._id': docId,
        },
        {
          $push: {
            documentActivityLog:
              this.assetBuilderService.createDocumentActivityLog(
                asset,
                docId,
                user,
              ),
          },
          $set: {
            lastUpdatedBy: user.adminId,
            'documents.$.status': DOCUMENT_STATUS.UPDATE_DELETE,
            'documents.$.display': display,
          },
        },
      );
    } else {
      updatedAsset = await this.dataServices.asset.findOneAndUpdate(
        {
          itemId: assetId,
          updatedAt: asset['updatedAt'],
          'documents._id': docId,
        },
        {
          $pull: { documents: { _id: docId } },
          $push: {
            documentActivityLog:
              this.assetBuilderService.createDocumentActivityLog(
                asset,
                docId,
                user,
              ),
          },
          $set: {
            lastUpdatedBy: user.adminId,
          },
        },
      );
    }
    if (!updatedAsset)
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'Cannot delete document');
    return { success: true };
  }

  async editDepositedNft(
    assetId: string,
    depositedNftId: string,
    editDepositedNft: EditDepositedNftDto,
    user: any,
  ) {
    const asset = await this.dataServices.asset.findOne({
      itemId: assetId,
    });
    if (!asset)
      throw ApiError(ErrorCode.DEFAULT_ERROR, `Id of Asset is invalid`);
    const depositedNFT = asset.custodianship.depositedNFTs.find(
      (nft) => nft['_id'].toString() === depositedNftId,
    );
    if (editDepositedNft.withdrawable > depositedNFT.balance) {
      throw ApiError(
        ErrorCode.DEFAULT_ERROR,
        'Withdrawable amount can not be larger than total deposited amount',
      );
    }
    if (
      (editDepositedNft.status === REVIEW_STATUS.APPROVED &&
        editDepositedNft.withdrawable >= depositedNFT.balance) ||
      (depositedNFT.status === REVIEW_STATUS.APPROVED &&
        editDepositedNft.withdrawable >= depositedNFT.balance)
    ) {
      throw ApiError(
        ErrorCode.DEFAULT_ERROR,
        'Withdrawable amount can not be equal or larger than total deposited amount',
      );
    }
    const updatedAsset = await this.dataServices.asset.findOneAndUpdate(
      {
        itemId: assetId,
        updatedAt: asset['updatedAt'],
        'custodianship.depositedNFTs._id': depositedNftId,
      },
      {
        $set: {
          'custodianship.depositedNFTs.$.status': editDepositedNft.status,
          'custodianship.depositedNFTs.$.withdrawable':
            editDepositedNft.withdrawable,
          lastUpdatedBy: user.adminId,
        },
      },
    );
    if (!updatedAsset)
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'Can not update asset');
    return { success: true };
  }

  async updateCustodianship(
    assetId: string,
    update: UpdateCustodianshipDto,
    user: any,
  ) {
    const asset = await this.dataServices.asset.findOne({
      itemId: assetId,
    });
    if (!asset) throw ApiError('', `Id of Asset is invalid`);

    if (update.isShow === CUSTODIANSHIP_DISPLAY.OFF) {
      const updatedAsset = await this.dataServices.asset.findOneAndUpdate(
        {
          itemId: assetId,
          updatedAt: asset['updatedAt'],
        },
        {
          $set: {
            'custodianship.isShow': CUSTODIANSHIP_DISPLAY.OFF
          }
        },
      );
      if (!updatedAsset)
        throw ApiError(ErrorCode.DEFAULT_ERROR, 'Can not update custodianship');
      return { success: true };
    }

    if (update.status && asset.custodianship.status > CUSTODIANSHIP_STATUS.FRAC)
      throw ApiError(
        ErrorCode.DEFAULT_ERROR,
        'Cannot update custodianship status',
      );

    if (asset.category === CategoryType.PHYSICAL) {
      if (update.storedByFrac && asset.status >= ASSET_STATUS.EXCHANGE)
        throw ApiError(ErrorCode.DEFAULT_ERROR, 'Cannot update storedByFrac');

      if (
        (update.warehousePrivate || update.warehousePublic) &&
        ((typeof update.storedByFrac !== 'undefined' && !update.storedByFrac) ||
          (typeof update.storedByFrac == 'undefined' &&
            !asset.custodianship.storedByFrac))
      )
        throw ApiError(
          ErrorCode.DEFAULT_ERROR,
          'Cannot update warehousePublic || warehousePrivate',
        );
    }

    const dataUpdate = await this.assetBuilderService.updateCustodianship(
      user,
      asset,
      update,
    );

    const updatedAsset = await this.dataServices.asset.findOneAndUpdate(
      {
        itemId: assetId,
        updatedAt: asset['updatedAt'],
      },
      dataUpdate,
    );
    if (!updatedAsset)
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'Can not update custodianship');
    return { success: true };
  }

  async editFile(
    user: any,
    assetId: string,
    fileId: string,
    data: UpdateCustodianshipFile,
  ) {
    const filter = {
      itemId: assetId,
    };
    const asset = await this.dataServices.asset.findOne(filter);
    if (
      data.status &&
      asset.custodianship.status >
        CUSTODIANSHIP_STATUS.FRACTOR_TO_FRAC_OR_IN_REVIEW
    )
      throw ApiError(
        ErrorCode.DEFAULT_ERROR,
        'Can not change file status now.',
      );
    if (!asset) throw ApiError('', `Id of Asset is invalid`);
    const updatedAsset = await this.dataServices.asset.findOneAndUpdate(
      {
        itemId: assetId,
        updatedAt: asset['updatedAt'],
        'custodianship.files._id': fileId,
      },
      {
        $set: {
          'custodianship.files.$.description': data.description,
          'custodianship.files.$.status': data.status,
          lastUpdatedBy: user.adminId,
        },
      },
    );
    if (!updatedAsset)
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'Cannot edit document');
    return { success: true };
  }

  async deleteFile(user, assetId: string, fileId: string) {
    const filter = {
      itemId: assetId,
    };

    const asset = await this.dataServices.asset.findOne(filter);
    if (!asset) throw ApiError('', `Id of Asset is invalid`);

    const updatedAsset = await this.dataServices.asset.findOneAndUpdate(
      {
        itemId: assetId,
        updatedAt: asset['updatedAt'],
        'custodianship.files._id': fileId,
      },
      {
        $pull: { 'custodianship.files': { _id: fileId } },
        $set: {
          lastUpdatedBy: user.adminId,
        },
      },
    );
    if (!updatedAsset)
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'Cannot delete file');
    return { success: true };
  }

  async addShipmentInfo(
    user: any,
    data: CreateShipmentInfoDto,
    assetId: string,
  ) {
    const filter = {
      itemId: assetId,
      category: CategoryType.PHYSICAL,
      deleted: false,
    };

    const asset = await this.dataServices.asset.findOne(filter);
    if (!asset) throw ApiError('', `Id of Asset is invalid`);

    //create new shipment-info
    const newShipmentInfo = await this.assetBuilderService.createShipmentInfo(
      data,
    );

    const updatedAsset = await this.dataServices.asset.findOneAndUpdate(
      filter,
      {
        $push: {
          'custodianship.listShipmentInfo': newShipmentInfo,
        },
        $set: {
          lastUpdatedBy: user.adminId,
        },
      },
      { new: true },
    );

    const last = updatedAsset.custodianship.listShipmentInfo.length - 1;
    return updatedAsset.custodianship.listShipmentInfo[last];
  }

  async editShipmentInfo(
    user: any,
    assetId: string,
    shipmentId: string,
    data: UpdateShipmentInfoDto,
  ) {
    const filter = { itemId: assetId };

    const asset = await this.dataServices.asset.findOne(filter);
    if (!asset)
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'Id of Asset is invalid');

    //update shipment-info
    const newShipmentInfo = await this.assetBuilderService.updateShipmentInfo(
      user,
      data,
    );

    const updatedAsset = await this.dataServices.asset.findOneAndUpdate(
      {
        itemId: assetId,
        updatedAt: asset['updatedAt'],
        'custodianship.listShipmentInfo._id': shipmentId,
      },
      {
        $set: newShipmentInfo,
      },
      { new: true },
    );
    if (!updatedAsset)
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'Cannot edit shipment info');

    return { success: true };
  }

  async removeShipmentInfo(user, assetId: string, shipmentId: string) {
    const filter = { itemId: assetId };

    const asset = await this.dataServices.asset.findOne(filter);
    if (!asset)
      throw ApiError(ErrorCode.DEFAULT_ERROR, `Id of Asset is invalid`);

    const updatedAsset = await this.dataServices.asset.findOneAndUpdate(
      {
        itemId: assetId,
        updatedAt: asset['updatedAt'],
        'custodianship.listShipmentInfo._id': shipmentId,
      },
      {
        $pull: { 'custodianship.listShipmentInfo': { _id: shipmentId } },
        $set: {
          lastUpdatedBy: user.adminId,
        },
      },
      { new: true },
    );
    if (!updatedAsset)
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'Cannot delete shipment info');

    return { success: true };
  }

  async changeIndexShipmentInfo(
    user: any,
    assetId: string,
    shipmentId: string,
    index: number,
  ) {
    const asset = await this.dataServices.asset.findOne({ itemId: assetId });
    if (!asset)
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'Id of Asset is invalid');

    const currentShipment = asset.custodianship.listShipmentInfo.filter(
      (s) => s['_id'] == shipmentId,
    );
    if (!currentShipment.length)
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'Id of shipment is invalid');

    if (asset.custodianship.listShipmentInfo.length < index + 1)
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'index is invalid');

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const updatedAsset1 = await this.dataServices.asset.findOneAndUpdate(
        {
          itemId: assetId,
          updatedAt: asset['updatedAt'],
          'custodianship.listShipmentInfo._id': shipmentId,
        },
        {
          $pull: { 'custodianship.listShipmentInfo': { _id: shipmentId } },
        },
        { session },
      );
      if (!updatedAsset1)
        throw ApiError(
          ErrorCode.DEFAULT_ERROR,
          'Cannot change index shipment info 1',
        );

      const updatedAsset2 = await this.dataServices.asset.findOneAndUpdate(
        {
          itemId: assetId,
        },
        {
          $push: {
            'custodianship.listShipmentInfo': {
              $each: currentShipment,
              $position: index,
            },
          },
          $set: {
            lastUpdatedBy: user.adminId,
          },
        },
        { session },
      );
      if (!updatedAsset2)
        throw ApiError(
          ErrorCode.DEFAULT_ERROR,
          'Cannot change index shipment info 2',
        );

      await session.commitTransaction();
      return { success: true };
    } catch (error) {
      await session.abortTransaction();
      this.logger.debug(error.message);
      throw error;
    } finally {
      session.endSession();
    }
  }
}
