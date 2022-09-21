import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { get, isEqual } from 'lodash';
import { ObjectId } from 'mongodb';
import mongoose from 'mongoose';
import { ApiError } from 'src/common/api';
import { ListDocument } from 'src/common/common-type';
import { ErrorCode, PREFIX_ID } from 'src/common/constants';
import { IDataServices } from 'src/core/abstracts/data-services.abstract';
import { MAX_PHOTOS, MIN_PHOTOS } from 'src/datalayer/model';
import {
  ASSET_STATUS,
  MEDIA_TYPE,
  OWNERSHIP_PRIVACY,
} from 'src/datalayer/model/asset.model';
import { MAX_FILE_SIZE } from 'src/datalayer/model/document-item.model';
import { AssetBuilderService } from './asset.factory.service';
import {
  CreateDocumentItemDto,
  UpdateDocumentItemDto,
} from './dto/documentItem.dto';
import { FilterAssetDto, FilterMoreUserAssetDto } from './dto/filter-asset.dto';

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

  async getListAsset(filter: FilterAssetDto) {
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
        { name: { $regex: filter.keyword.trim(), $options: 'i' } },
        { itemId: { $regex: filter.keyword.trim(), $options: 'i' } },
        { category: { $regex: filter.keyword.trim(), $options: 'i' } },
        {
          'assetTypeName.en': { $regex: filter.keyword.trim(), $options: 'i' },
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
      query['$and'] = (query['$and'] || []).push({
        $lte: new Date(filter.toDate),
      });
    }
    console.log(query);

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

    const dataQuery = await this.dataServices.asset.aggregate(agg, {
      collation: { locale: 'en' },
    });

    const data = get(dataQuery, [0, 'data']);
    const response = this.assetBuilderService.convertAssets(data);
    const count = get(dataQuery, [0, 'count', 0, 'count']) || 0;

    return {
      totalDocs: count,
      docs: response || [],
    } as ListDocument;
  }

  async getDetail(assetId: string) {
    const currentAsset = await this.dataServices.asset.findOne({
      _id: assetId,
      deleted: false,
    });
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
      currentAssetType?.name,
    );
    return response;
  }

  async getMoreFromThisFractor(filter: FilterMoreUserAssetDto) {
    const query: any = {
      collectionId: new ObjectId(filter.collectionId),
      ownershipPrivacy: OWNERSHIP_PRIVACY.PUBLIC,
      status: { $ne: ASSET_STATUS.IN_REVIEW },
      _id: { $ne: new ObjectId(filter.assetId) },
      deleted: false,
    };

    const agg = [];

    agg.push(
      {
        $match: query,
      },
      {
        $project: { specifications: 0, documents: 0 },
      },
    );

    const dataReturnFilter = [
      { $sort: { createdAt: -1 } },
      { $skip: filter.offset || 0 },
      { $limit: filter.limit || 10 },
    ];
    agg.push({
      $facet: {
        count: [{ $count: 'count' }],
        data: dataReturnFilter,
      },
    });

    const dataQuery = await this.dataServices.asset.aggregate(agg, {
      collation: { locale: 'en' },
    });

    const data = get(dataQuery, [0, 'data']);
    const response = this.assetBuilderService.convertAssets(data);
    const count = get(dataQuery, [0, 'count', 0, 'count']) || 0;

    return {
      totalDocs: count,
      docs: response || [],
    } as ListDocument;
  }

  async remove(user: any, assetId: string) {
    await this.dataServices.asset.findOneAndUpdate(
      {
        _id: assetId,
        ownerId: user.fractorId,
        deleted: false,
      },
      { $set: { deleted: true } },
      {},
    );

    return { success: true };
  }

  async addDocumentItem(user: any, data: CreateDocumentItemDto) {
    const filter = {
      _id: data.assetId,
      ownerId: user.fractorId,
      status: ASSET_STATUS.OPEN,
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
      user.fractorId,
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
      },
      { new: true },
    );

    return newAsset.documents[0];
  }

  async editDocumentItem(
    user: any,
    assetId: string,
    docId: string,
    data: UpdateDocumentItemDto,
  ) {
    const filter = {
      _id: assetId,
      'documents._id': docId,
      ownerId: user.fractorId,
      status: ASSET_STATUS.OPEN,
      deleted: false,
    };

    const asset = await this.dataServices.asset.findOne(filter);
    if (!asset) throw ApiError('', `Id of Asset is invalid`);

    const updatedDoc = await this.deleteDocumentItem(
      asset.documents,
      docId,
      filter,
    );

    // update description
    updatedDoc.description = data.description;

    const updatedAsset = await this.dataServices.asset.findOneAndUpdate(
      { _id: assetId },
      {
        $push: {
          documents: {
            $each: [updatedDoc],
            $position: 0,
          },
        },
      },
      { new: true },
    );

    return updatedAsset.documents[0];
  }

  async deleteDocumentItem(documentItems: any, docId: string, filter: any) {
    let currentDocumentItem;
    for (let i = 0; i < documentItems.length; i++) {
      if (documentItems[i]._id.toString() === docId.toString()) {
        const uploadBy = documentItems[i].uploadBy.split('-')[0];
        if (uploadBy == PREFIX_ID.ADMIN)
          throw ApiError('', 'You are not admin');

        // get currentDocumentItem
        currentDocumentItem = documentItems[i];

        //delete documentItem
        await this.dataServices.asset.updateOne(filter, {
          $pull: { documents: { _id: documentItems[i]._id } },
        });

        break;
      }
    }

    return currentDocumentItem;
  }

  async removeDocumentItem(user: any, assetId: string, docId: string) {
    const filter = {
      _id: assetId,
      'documents._id': docId,
      ownerId: user.fractorId,
      status: ASSET_STATUS.OPEN,
      deleted: false,
    };

    const asset = await this.dataServices.asset.findOne(filter);
    if (!asset) throw ApiError('', `Id of Asset is invalid`);

    const newDocumentItems = await this.deleteDocumentItem(
      asset.documents,
      docId,
      filter,
    );

    if (!newDocumentItems)
      throw ApiError(ErrorCode.NO_DATA_EXISTS, 'no data exists');

    return { success: true };
  }
}
