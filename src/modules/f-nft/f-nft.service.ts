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
  F_NFT_STATUS,
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
          contractAddress: { $first: '$contractAddress' },
          totalSupply: { $first: '$totalSupply' },
          status: { $first: '$status' },
          fnftId: { $first: '$fnftId' },
          fractionalizedBy: { $first: '$fractionalizedBy' },
          fractionalizedOn: { $first: '$fractionalizedOn' },
          sizeOfItem: { $first: '$sizeOfItem' },
          items: { $push: { $arrayElemAt: ['$items', 0] } },
          createdAt: { $first: '$createdAt' },
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

    if (Object.keys(where).length > 0) {
      agg.push({ $match: where });
    }

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

      const fnft = await this.dataServices.fnft.findOne({
        tokenName: data.tokenName,
        deleted: false,
      });
      if (fnft)
        throw ApiError(
          ErrorCode.INVALID_TOKENSYMBOL_OR_TOKENNAME,
          'tokenSymbol or tokenName already exists',
        );

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
    console.log(data);

    if (!data.items.length)
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'items not data');

    if (iaoRequestId) await this.checkStatusOfAssets(data.items);

    await this.checkStatusOfNfts(iaoRequestId, data);
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

  async getDetail(id: string, user: any) {
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

    return await this.fnftBuilderService.convertFnftDetail(
      currentFnft,
      currentFnft.items,
      listNft,
      relatedAdminList,
    );
  }

  async update(id: string, user: any, data: UpdateFnftDto) {
    const filter = { fnftId: id, deleted: false };

    const currentFnft = await this.dataServices.fnft.findOne(filter);
    if (!currentFnft)
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'Id not already exists');

    if (currentFnft.status !== F_NFT_STATUS.ACTIVE)
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'Status invalid');

    const isName = await this.dataServices.fnft.findOne({
      tokenName: data.tokenName,
    });
    if (isName)
      throw ApiError(
        ErrorCode.INVALID_TOKENSYMBOL_OR_TOKENNAME,
        'TokenName already exists',
      );

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
}
