import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { get, isEqual } from 'lodash';
import mongoose from 'mongoose';
import { ApiError } from 'src/common/api';
import { ListDocument } from 'src/common/common-type';
import { ErrorCode } from 'src/common/constants';
import { IDataServices } from 'src/core/abstracts/data-services.abstract';
import { MAX_PHOTOS, MIN_PHOTOS } from 'src/datalayer/model';
import { MEDIA_TYPE } from 'src/datalayer/model/asset.model';
import { MAX_FILE_SIZE } from 'src/datalayer/model/document-item.model';
import { AssetBuilderService } from './asset.factory.service';
import {
  CreateDocumentItemDto,
  UpdateDocumentItemDto,
} from './dto/documentItem.dto';
import { FilterAssetDto } from './dto/filter-asset.dto';
import { DISPLAY_STATUS, FilterDocumentDto } from './dto/filter-document.dto';
import { Role } from 'src/modules/auth/role.enum';
import { Utils } from 'src/common/utils';
import { EditDepositedNftDto } from './dto/edit-deposited-nft.dto';
const ufs = require('url-file-size');

@Injectable()
export class AssetService {
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
    if (filter.custodianshipStatus)
      query['custodianshipStatus'] = filter.custodianshipStatus;
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
              localField: 'typeId',
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
              typeId: '$asset.typeId',
              ownerId: '$asset.ownerId',
              collectionId: '$asset.collectionId',
              documents: '$asset.documents',
              deleted: '$asset.deleted',
              inDraft: '$asset.inDraft',
              custodianshipStatus: '$custodianshipStatus',
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

  async getDetail(assetId: string) {
    const currentAssetDocument = await this.searchDocument(assetId, {});

    const [currentAsset] = await this.dataServices.asset.aggregate([
      {
        $match: {
          itemId: assetId,
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

    const response = this.assetBuilderService.convertAssetDetail(
      currentAsset,
      currentUser,
      currentAssetType,
      currentAssetDocument,
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
          $set: { deleted: { $not: '$deleted' }, lastUpdatedBy: user.adminId },
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
    const newDoc = await this.assetBuilderService.createDocumentItem(
      data,
      fileSize,
      user.adminId,
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

    const updatedAsset = await this.dataServices.asset.findOneAndUpdate(
      {
        itemId: assetId,
        updatedAt: asset['updatedAt'],
        'documents._id': docId,
      },
      {
        $pull: { documents: { _id: docId } },
        $set: {
          lastUpdatedBy: user.adminId,
        },
      },
    );
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
    const updatedAsset = await this.dataServices.asset.findOneAndUpdate(
      {
        itemId: assetId,
        updatedAt: asset['updatedAt'],
        'depositedNFTs._id': depositedNftId,
      },
      {
        $set: {
          'depositedNFTs.$.status': editDepositedNft.status,
          'depositedNFTs.$.withdrawable': editDepositedNft.withdrawable,
          lastUpdatedBy: user.adminId,
        },
      },
    );
    if (!updatedAsset)
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'Can not update asset');
    return { success: true };
  }
}
