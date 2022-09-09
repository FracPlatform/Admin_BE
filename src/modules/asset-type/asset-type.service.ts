import { Injectable } from '@nestjs/common';
import { DEFAULT_LIMIT, DEFAULT_OFFET } from 'src/common/constants';
import { IDataServices } from 'src/core/abstracts/data-services.abstract';
import { CreateAssetTypeDto } from './dto/create-asset-type.dto';
import { GetAssetTypeByIdDto } from './dto/get-asset-type-by-id.dto';
import {
  ASSET_TYPE_STATUS,
  GetListAssetTypeDto,
} from './dto/get-list-asset-type.dto';
import { get } from 'lodash';
import { AddSpecificationDto } from './dto/add-specifications.dto';
import { EditAssetTypeDto } from './dto/edit-asset-type.dto';

@Injectable()
export class AssetTypeService {
  constructor(private readonly dataService: IDataServices) {}

  async getListAssetType({
    category,
    status,
    keyword,
    limit = DEFAULT_LIMIT,
    offset = DEFAULT_OFFET,
    sortField,
    sortType,
  }: GetListAssetTypeDto) {
    const where = { isActive: true };
    const sort = { $sort: {} };
    if (category) where['category'] = category;
    if (keyword) where['name.en'] = { $regex: keyword, $options: 'i' };
    if (status === ASSET_TYPE_STATUS.ACTIVE) where['isActive'] = true;
    if (status === ASSET_TYPE_STATUS.INACTIVE) where['isActive'] = false;
    if (sortField && sortType) sort['$sort'][sortField] = sortType;
    else sort['$sort']['createdAt'] = -1;
    const listAssetTypesAggregate = await this.dataService.assetTypes.aggregate(
      [
        { $match: where },
        {
          $project: {
            assetTypeId: {
              $concat: ['$prefix', '-', { $toString: '$typeId' }],
            },
            name: 1,
            category: 1,
            isActive: 1,
            borderColor: 1,
            logoImage: 1,
            description: 1,
            specifications: 1,
          },
        },
        sort,
        {
          $facet: {
            count: [{ $count: 'count' }],
            data: [{ $skip: offset }, limit && { $limit: limit }],
          },
        },
      ],
      { collation: { locale: 'en', caseLevel: true } },
    );

    const data = get(listAssetTypesAggregate, [0, 'data']);
    const count = get(listAssetTypesAggregate, [0, 'count', 0, 'count']) || 0;

    return {
      totalDocs: count,
      docs: data || [],
    };
  }

  async getAssetTypeById(params: GetAssetTypeByIdDto) {
    const counter = parseInt(params.id.split('-')[1]);
    const assetType = await this.dataService.assetTypes.findOne({
      typeId: counter,
    });
    return assetType;
  }

  async createAssetType(createAssetTypeBody: CreateAssetTypeDto) {
    await this.dataService.assetTypes.create(createAssetTypeBody);
    return { success: true };
  }

  async updateAssetType(
    params: GetAssetTypeByIdDto,
    newAssetTypeData: EditAssetTypeDto,
  ) {
    const counter = parseInt(params.id.split('-')[1]);
    await this.dataService.assetTypes.updateOne(
      { typeId: counter },
      {
        $set: newAssetTypeData,
      },
    );
    return { success: true };
  }

  async addSpecifications(
    params: GetAssetTypeByIdDto,
    newSpecifications: AddSpecificationDto,
  ) {
    const counter = parseInt(params.id.split('-')[1]);
    await this.dataService.assetTypes.updateOne(
      {
        typeId: counter,
      },
      {
        $push: {
          specifications: { $each: newSpecifications.specifications },
        },
      },
    );
    return { success: true };
  }
}
