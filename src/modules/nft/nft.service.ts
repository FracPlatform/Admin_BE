import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { ApiError } from 'src/common/api';
import { ErrorCode } from 'src/common/constants';
import { Utils } from 'src/common/utils';
import { IDataServices } from 'src/core/abstracts/data-services.abstract';
import { ASSET_STATUS, CategoryType, NFT_STATUS } from 'src/datalayer/model';
import { CreateNftDto } from './dto/create-nft.dto';
import { ASSET_CATEGORY, GetListNftDto } from './dto/get-list-nft.dto';
import { NftBuilderService } from './nft.factory.service';
import { get } from 'lodash';
import { EditNftDto } from './dto/edit-nft.dto';
import { S3Service } from 'src/s3/s3.service';

@Injectable()
export class NftService {
  constructor(
    private readonly dataService: IDataServices,
    private readonly nftBuilderService: NftBuilderService,
    private readonly s3Service: S3Service,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async getListNft(filter: GetListNftDto) {
    const query = { deleted: false };
    if (filter.status) query['status'] = filter.status;
    if (filter.nftType) query['nftType'] = filter.nftType;
    if (filter.keyword) {
      query['$or'] = [
        {
          name: {
            $regex: Utils.escapeRegex(filter.keyword.trim()),
            $options: 'i',
          },
        },
        {
          tokenId: {
            $regex: Utils.escapeRegex(filter.keyword.trim()),
            $options: 'i',
          },
        },
        {
          assetName: {
            $regex: Utils.escapeRegex(filter.keyword.trim()),
            $options: 'i',
          },
        },
      ];
    }
    if (filter.assetType) query['assetType'] = filter.assetType;
    if (filter.assetCategory) {
      switch (filter.assetCategory) {
        case ASSET_CATEGORY.PHYSICAL:
          query['assetCategory'] = CategoryType.PHYSICAL;
          break;
        case ASSET_CATEGORY.DIGITAL_NFT:
          query['assetCategory'] = CategoryType.VIRTUAL;
          query['isMintNFT'] = true;
          break;
        case ASSET_CATEGORY.DIGITAL_NON_NFT:
          query['assetCategory'] = CategoryType.VIRTUAL;
          query['isMintNFT'] = false;
          break;
        default:
          break;
      }
    }
    const agg = [];
    agg.push(
      {
        $lookup: {
          from: 'Asset',
          let: { assetId: '$assetId' },
          pipeline: [
            {
              $match: { $expr: { $eq: ['$itemId', '$$assetId'] } },
            },
            {
              $project: {
                category: 1,
                name: 1,
                isMintNFT: 1,
              },
            },
          ],
          as: 'asset',
        },
      },
      {
        $lookup: {
          from: 'AssetType',
          let: { assetTypeId: '$assetType' },
          pipeline: [
            {
              $match: { $expr: { $eq: ['$assetTypeId', '$$assetTypeId'] } },
            },
            {
              $project: {
                name: 1,
                media: 1,
              },
            },
          ],
          as: 'assetType',
        },
      },
      {
        $unwind: {
          path: '$asset',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: '$assetType',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          tokenId: '$tokenId',
          createdAt: '$createdAt',
          name: '$name',
          nftType: '$nftType',
          assetTypeName: '$asseType.name.en',
          assetCategory: '$assetCategory',
          assetType: '$assetType',
          asset: '$asset',
          status: '$status',
        },
      },
      { $match: query },
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
    const dataQuery = await this.dataService.nft.aggregate(agg, {
      collation: { locale: 'en' },
    });
    const data = get(dataQuery, [0, 'data']);
    const count = get(dataQuery, [0, 'count', 0, 'count']) || 0;

    return {
      totalDocs: count,
      docs: data,
    };
  }

  async getNFTDetail(id: string) {
    const nft = await this.dataService.nft.findOne({ tokenId: id });
    const agg = [];
    agg.push(
      {
        $match: {
          tokenId: id,
          deleted: false,
        },
      },
      {
        $lookup: {
          from: 'Fnft',
          localField: 'tokenId',
          foreignField: 'items',
          as: 'fnft',
        },
      },
      {
        $unwind: { path: '$fnft', preserveNullAndEmptyArrays: true },
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
        $unwind: { path: '$createdByAdmin', preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: 'Admin',
          localField: 'fnft.fractionalizedBy',
          foreignField: 'adminId',
          as: 'fractionalizedByAdmin',
        },
      },
      {
        $unwind: {
          path: '$fractionalizedByAdmin',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'Admin',
          localField: 'mintedBy',
          foreignField: 'adminId',
          as: 'mintedByAdmin',
        },
      },
      {
        $unwind: {
          path: '$mintedByAdmin',
          preserveNullAndEmptyArrays: true,
        },
      },
    );
    if (nft.assetId)
      agg.push(
        {
          $lookup: {
            from: 'Asset',
            localField: 'assetId',
            foreignField: 'itemId',
            as: 'asset',
          },
        },
        {
          $unwind: {
            path: '$asset',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: 'IAORequest',
            localField: 'assetId',
            foreignField: 'items',
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
            from: 'Fractor',
            localField: 'asset.ownerId',
            foreignField: 'fractorId',
            as: 'fractor',
          },
        },
        {
          $unwind: {
            path: '$fractor',
            preserveNullAndEmptyArrays: true,
          },
        },
      );
    const queryNft = await this.dataService.nft.aggregate(agg, {
      collation: { locale: 'en' },
    });
    const finalNft = this.nftBuilderService.convertNFTDetail(queryNft[0]);
    return finalNft;
  }

  async createNft(body: CreateNftDto, user: any) {
    if (body.assetId) {
      const assetItem = await this.dataService.asset.findOne({
        itemId: body.assetId,
      });
      if (!assetItem) throw ApiError(ErrorCode.DEFAULT_ERROR, 'Invalid asset');
      if (assetItem.status < ASSET_STATUS.IAO_APPROVED)
        throw ApiError(ErrorCode.DEFAULT_ERROR, 'Invalid asset');
    }
    if (body.assetType) {
      const assetType = await this.dataService.assetTypes.findOne({
        assetTypeId: body.assetType,
      });
      if (!assetType || assetType.category !== body.assetCategory)
        throw ApiError(ErrorCode.DEFAULT_ERROR, 'Invalid asset type');
    }
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const newNft = await this.nftBuilderService.createNft(
        body,
        user,
        session,
      );
      await this.dataService.nft.create(newNft, { session });
      await session.commitTransaction();
      return newNft;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async editNFT(id: string, body: EditNftDto) {
    const nft = await this._validateNFT(id);

    const res = await this.dataService.nft.findOneAndUpdate(
      {
        tokenId: id,
        updatedAt: nft['updatedAt'],
      },
      {
        $set: body,
      },
    );
    if (!res) throw ApiError(ErrorCode.DEFAULT_ERROR, 'Can not update NFT');
    return { success: true };
  }

  async deleteNFT(id: string) {
    const nft = await this._validateNFT(id);
    const res = await this.dataService.nft.findOneAndUpdate(
      {
        tokenId: id,
        updatedAt: nft['updatedAt'],
      },
      {
        $set: {
          deleted: true,
        },
      },
    );
    if (!res) throw ApiError(ErrorCode.DEFAULT_ERROR, 'Can not delete NFT');
    return { success: true };
  }

  async editDisplayNFT(id: string) {
    const nft = await this._validateNFT(id);
    const res = await this.dataService.nft.findOneAndUpdate(
      {
        tokenId: id,
        updatedAt: nft['updatedAt'],
      },
      [
        {
          $set: {
            display: { $not: '$display' },
          },
        },
      ],
    );
    if (!res) throw ApiError(ErrorCode.DEFAULT_ERROR, 'Can not update NFT');
    return { success: true };
  }

  private async _validateNFT(id: string) {
    const nft = await this.dataService.nft.findOne({
      tokenId: id,
    });
    if (!nft || nft.deleted)
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'NFT not exists');
    if (nft.status > NFT_STATUS.DRAFT)
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'Cannot edit NFT');
    return nft;
  }
}
