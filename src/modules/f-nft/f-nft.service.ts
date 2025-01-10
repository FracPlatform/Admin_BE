import { Injectable, Logger } from '@nestjs/common';
import { DEFAULT_LIMIT, DEFAULT_OFFET, ErrorCode } from 'src/common/constants';
import { IDataServices } from 'src/core/abstracts/data-services.abstract';
import { get } from 'lodash';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { ListDocument } from 'src/common/common-type';
import { FnftBuilderService } from './f-nft.factory.service';
import { ApiError } from 'src/common/api';
import {
  CheckExistsDto,
  CreateFnftDto,
  FilterFnftDto,
  UpdateFnftDto,
} from './dto/f-nft.dto';
import { NFT_STATUS, NFT_TYPE } from 'src/datalayer/model/nft.model';
import {
  ASSET_STATUS,
  F_NFT_MINTED_STATUS,
  F_NFT_STATUS,
  IAOEvent,
  IAO_EVENT_STATUS,
  IAO_REQUEST_STATUS,
} from 'src/datalayer/model';

@Injectable()
export class FnftService {
  private readonly logger = new Logger(FnftService.name);

  constructor(
    private readonly dataServices: IDataServices,
    private readonly fnftBuilderService: FnftBuilderService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async getListFnft(user: any, filter: FilterFnftDto) {
    const query: any = { deleted: false };
    const filterIsLinkedIAOEvent = [
      {
        $lookup: {
          from: IAOEvent.name,
          let: { fnftContractAddress: '$contractAddress' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$FNFTcontractAddress', '$$fnftContractAddress'],
                },
              },
            },
            {
              $project: {
                _id: 1,
                isDeleted: 1,
              },
            },
          ],
          as: 'iaoEvents',
        },
      },
      {
        $addFields: {
          iaoEvent: { $arrayElemAt: ['$iaoEvents', 0] },
        },
      },
      {
        $match: {
          $or: [
            { iaoEvent: { $exists: false } },
            { iaoEvent: { $exists: true }, 'iaoEvent.isDeleted': true },
          ],
        },
      },
    ];
    if (filter.status) {
      const filterStatus = filter.status.split(',');
      const status: any = filterStatus.map((e) => parseInt(e));
      query['status'] = { $in: status };
    }

    if (filter.mintedStatus) {
      const filterMinted = filter.mintedStatus.split(',');
      const mintedStatus: any = filterMinted.map((e) => parseInt(e));
      query['mintedStatus'] = { $in: mintedStatus };
    }

    const agg = [];
    if (filter.isLinkedIAOEvent) {
      agg.push(...filterIsLinkedIAOEvent);
    }
    agg.push(
      {
        $match: query,
      },
      {
        $addFields: { sizeOfItem: { $size: '$items' } },
      },
    );

    if (filter.hasOwnProperty('isUsed')) {
      agg.push(
        {
          $lookup: {
            from: 'IAOEvent',
            let: { contractAddress: '$contractAddress' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$FNFTcontractAddress', '$$contractAddress'] },
                  isDeleted: false,
                },
              },
              {
                $project: {
                  _id: 1,
                },
              },
            ],
            as: 'IAOEvent',
          },
        },
        {
          $addFields: { isUsed: { $toBool: { $size: '$IAOEvent' } } },
        },
      );
    }

    agg.push(
      {
        $unwind: '$items',
      },
      {
        $lookup: {
          from: 'Nft',
          let: { items: '$items' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$tokenId', '$$items'] },
              },
            },
            {
              $project: {
                _id: 1,
                name: 1,
                mediaUrl: 1,
                previewUrl: 1,
                tokenId: 1,
              },
            },
          ],
          as: 'items',
        },
      },
      {
        $group: {
          _id: '$_id',
          tokenSymbol: { $first: '$tokenSymbol' },
          tokenLogo: { $first: '$tokenLogo' },
          contractAddress: { $first: '$contractAddress' },
          totalSupply: { $first: '$totalSupply' },
          status: { $first: '$status' },
          fnftId: { $first: '$fnftId' },
          fractionalizedBy: { $first: '$fractionalizedBy' },
          fractionalizedOn: { $first: '$fractionalizedOn' },
          sizeOfItem: { $first: '$sizeOfItem' },
          items: { $push: { $arrayElemAt: ['$items', 0] } },
          createdAt: { $first: '$createdAt' },
          isUsed: { $first: '$isUsed' },
          iaoEvent: { $first: '$iaoEvent' },
        },
      },
    );

    const where = {};

    if (filter.name) {
      where['$or'] = [
        { 'items.name': { $regex: filter.name.trim(), $options: 'i' } },
        { contractAddress: { $regex: filter.name.trim(), $options: 'i' } },
        { tokenSymbol: { $regex: filter.name.trim(), $options: 'i' } },
      ];
    }

    if (filter.hasOwnProperty('isUsed')) {
      where['isUsed'] = filter.isUsed;
    }

    if (Object.keys(where).length > 0) {
      agg.push({ $match: where });
    }

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

    const dataQuery = await this.dataServices.fnft.aggregate(agg, {
      collation: { locale: 'en' },
    });

    const data = get(dataQuery, [0, 'data']);
    const response = this.fnftBuilderService.convertFnfts(data);
    const count = get(dataQuery, [0, 'count', 0, 'count']) || 0;

    return {
      totalDocs: count,
      docs: response || [],
    } as ListDocument;
  }

  async checkExists(user: any, data: CheckExistsDto) {
    const fnft = await this.dataServices.fnft.findOne({
      tokenSymbol: data.tokenSymbol,
      deleted: false,
    });
    if (fnft) return { ok: false };

    return { ok: true };
  }

  async createFnft(user: any, data: CreateFnftDto) {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      // check items
      await this.checkItems(data.iaoRequestId, data);

      const fnftObj = await this.fnftBuilderService.createFnft(
        data,
        user,
        session,
      );
      const newFnft = await this.dataServices.fnft.create(fnftObj, { session });
      await session.commitTransaction();

      return newFnft;
    } catch (error) {
      await session.abortTransaction();
      this.logger.debug(error.message);
      throw ApiError('', error.message);
    } finally {
      session.endSession();
    }
  }

  async checkItems(iaoRequestId: string, data: CreateFnftDto) {
    if (iaoRequestId) {
      this._checkDuplicateIaoRequest(iaoRequestId);

      const iaoRequest = await this.dataServices.iaoRequest.findOne({
        iaoId: iaoRequestId,
      });
      if (!iaoRequest)
        throw ApiError(
          ErrorCode.DEFAULT_ERROR,
          'IaoRequest not already exists',
        );

      if (iaoRequest.status !== IAO_REQUEST_STATUS.APPROVED_B)
        throw ApiError(ErrorCode.INVALID_IAO_STATUS, 'Status invalid');

      data.items = iaoRequest.items;
    }

    if (!data.items.length)
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'items not data');

    if (iaoRequestId) await this.checkStatusOfAssets(data.items);

    await this.checkStatusOfNfts(iaoRequestId, data);
  }

  private async _checkDuplicateIaoRequest(iaoRequestId: string) {
    const fNFT = await this.dataServices.fnft.findOne({
      iaoRequestId: iaoRequestId,
      status: F_NFT_STATUS.ACTIVE,
      mintedStatus: F_NFT_MINTED_STATUS.MINTED,
      deleted: false,
    });
    if (fNFT) {
      throw ApiError(
        ErrorCode.DEFAULT_ERROR,
        `Already existed F-NFT minted from IAO request: ${iaoRequestId}`,
      );
    }
  }

  async checkStatusOfAssets(items: string[]) {
    const listAsset = await this.dataServices.asset.findMany(
      {
        itemId: { $in: items },
        status: ASSET_STATUS.CONVERTED_TO_NFT,
        deleted: false,
      },
      { _id: 1 },
    );
    if (!listAsset.length)
      throw ApiError(
        ErrorCode.DEFAULT_ERROR,
        'Asset item must converted to NFT',
      );

    if (items.length !== listAsset.length)
      throw ApiError(
        ErrorCode.INVALID_ITEMS_STATUS,
        'Asset item must converted to NFT',
      );
  }

  async checkStatusOfNfts(iaoRequestId: string, data: CreateFnftDto) {
    const filter = { status: NFT_STATUS.MINTED };

    if (iaoRequestId) {
      filter['nftType'] = NFT_TYPE.FRACTOR_ASSET;
      filter['assetId'] = { $in: data.items };
    } else {
      filter['nftType'] = NFT_TYPE.FRAC_ASSET;
      filter['tokenId'] = { $in: data.items };
    }

    const listNft = await this.dataServices.nft.findMany(filter, {
      _id: 0,
      assetId: 1,
      tokenId: 1,
    });

    if (!listNft.length)
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'nft not already exists');

    if (data.items.length !== listNft.length)
      throw ApiError(ErrorCode.INVALID_ITEMS_NFT_STATUS, 'nft status invalid');

    const items = [];
    const variable = iaoRequestId ? 'assetId' : 'tokenId';
    for (const i of data.items) {
      const currentNft = listNft.find((n) => n[variable] == i);
      items.push(currentNft.tokenId);
    }

    data.items = items;
  }

  async getDetail(id: string) {
    const filter = {
      $or: [{ fnftId: id }, { contractAddress: id }],
      deleted: false,
    };

    const currentFnft = await this.dataServices.fnft.findOne(filter);
    if (!currentFnft)
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'Id not already exists');

    const listNft = await this.dataServices.nft.findMany(
      { tokenId: { $in: currentFnft.items } },
      {
        _id: 1,
        tokenId: 1,
        previewUrl: 1,
        mediaUrl: 1,
        name: 1,
        description: 1,
        status: 1,
        assetId: 1,
      },
    );
    if (!listNft) throw ApiError(ErrorCode.NO_DATA_EXISTS, 'nft data exists');

    // create adminIds
    let adminIds = [currentFnft.fractionalizedBy, currentFnft.lastUpdateBy];
    adminIds = [...new Set(adminIds)];

    const relatedAdminList = await this.dataServices.admin.findMany(
      { adminId: { $in: adminIds } },
      { adminId: 1, fullname: 1 },
    );
    if (!relatedAdminList.length)
      throw ApiError(
        ErrorCode.DEFAULT_ERROR,
        'related Admin not already exists',
      );
    const iaoEvent = await this.dataServices.iaoEvent.findOne({
      FNFTcontractAddress: currentFnft.contractAddress,
      status: IAO_EVENT_STATUS.ACTIVE,
      isDeleted: false,
    });

    return await this.fnftBuilderService.convertFnftDetail(
      currentFnft,
      currentFnft.items,
      listNft,
      relatedAdminList,
      iaoEvent,
    );
  }

  async update(id: string, user: any, data: UpdateFnftDto) {
    if (!data.tokenLogo && !data.tokenName)
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'No data');

    const filter = { fnftId: id, deleted: false };

    const currentFnft = await this.dataServices.fnft.findOne(filter);
    if (!currentFnft)
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'Id not already exists');

    if (currentFnft.status !== F_NFT_STATUS.ACTIVE)
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'Status invalid');

    const updateFnftObj = await this.fnftBuilderService.updateFnft(
      data,
      user.adminId,
    );

    return await this.dataServices.fnft.findOneAndUpdate(
      {
        ...filter,
        status: F_NFT_STATUS.ACTIVE,
        updatedAt: currentFnft['updatedAt'],
      },
      updateFnftObj,
      { new: true },
    );
  }

  async deleteFnftDraft(user: any, fnftId: string) {
    const fnft = await this.dataServices.fnft.findOne({
      fnftId,
      deleted: false,
    });
    if (!fnft) throw ApiError(ErrorCode.DEFAULT_ERROR, 'Id not already exists');
    if (fnft.fractionalizedBy !== user.adminId)
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'You are not the fractionalized');
    if (fnft.mintedStatus !== F_NFT_MINTED_STATUS.PROCESS)
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'Fnft has been minted');

    return await this.dataServices.fnft.updateOne(
      { _id: fnft['_id'] },
      { deleted: true },
    );
  }
}
