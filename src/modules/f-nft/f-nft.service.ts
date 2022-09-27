import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { DEFAULT_LIMIT, DEFAULT_OFFET, ErrorCode } from 'src/common/constants';
import { IDataServices } from 'src/core/abstracts/data-services.abstract';
import { get } from 'lodash';
import { ObjectId } from 'mongodb';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { ListDocument } from 'src/common/common-type';
import { FnftBuilderService } from './f-nft.factory.service';
import { ApiError } from 'src/common/api';
import { CreateFnftDto, FilterFnftDto } from './dto/f-nft.dto';

@Injectable()
export class FnftService {
  private readonly logger = new Logger(FnftService.name);

  constructor(
    private readonly dataServices: IDataServices,
    private readonly fnftBuilderService: FnftBuilderService,
    @InjectConnection() private readonly connection: Connection,
  ) { }

  async getListFnft(user: any, filter: FilterFnftDto) {
    const query: any = { deleted: false };

    if (filter.name) {
      query['$or'] = [
        { fullname: { $regex: filter.name.trim(), $options: 'i' } },
        { walletAddress: { $regex: filter.name.trim(), $options: 'i' } },
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
        $project: {
          tokenSymbol: 1,
          items: 1,
          contractAddress: 1,
          totalSupply: 1,
          status: 1,
          fractionalizedBy: 1,
          fractionalizedOn: 1,
          fnftId: 1,
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

    const dataQuery = await this.dataServices.admin.aggregate(agg, {
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

  async createFnft(user: any, data: CreateFnftDto) {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {


      const fnft = await this.dataServices.fnft.findOne({
        tokenSymbol: data.tokenSymbol,
        tokenName: data.tokenName,
        deleted: false,
      });
      if (fnft)
        throw ApiError(ErrorCode.DEFAULT_ERROR, 'Fnft already exists'); //-> E11

      const fnftObj = await this.fnftBuilderService.createFnft(data, user, session);
      const newFnft = await this.dataServices.fnft.create(fnftObj, {
        session,
      });
      await session.commitTransaction();
      return newFnft;
    } catch (error) {
      await session.abortTransaction();
      this.logger.debug(error.message);
      throw ApiError('', 'Cannot create f-nft');
    } finally {
      session.endSession();
    }
  }

  async checkItems(iaoRequestId: string, items: any) {
    let filter = {
      assetId: { $in: items },
      status: 'Minted',
    };

    if (!iaoRequestId) {

    }

    const listNft = await this.dataServices.nft.findMany(filter, { _id: 1 });
  }
}
