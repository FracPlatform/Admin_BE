import { Injectable } from '@nestjs/common';
import { DEFAULT_LIMIT, DEFAULT_OFFET, PREFIX_ID } from 'src/common/constants';
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
import { Utils } from 'src/common/utils';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { EditSpecificationDto } from './dto/edit-specification.dto';
import { DeleteSpecificationDto } from './dto/delete-specification.dto';

@Injectable()
export class AssetTypeService {
  constructor(
    private readonly dataService: IDataServices,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async getListAssetType({
    category,
    status,
    keyword,
    limit = DEFAULT_LIMIT,
    offset = DEFAULT_OFFET,
    sortField,
    sortType,
  }: GetListAssetTypeDto) {
    const where = {};
    const sort = { $sort: {} };
    const dataPagination: any[] = [{ $skip: offset }];
    if (category) where['category'] = category;
    if (keyword) where['name.en'] = { $regex: keyword, $options: 'i' };
    if (status === ASSET_TYPE_STATUS.ACTIVE) where['isActive'] = true;
    if (status === ASSET_TYPE_STATUS.INACTIVE) where['isActive'] = false;
    if (sortField && sortType) sort['$sort'][sortField] = sortType;
    else sort['$sort']['createdAt'] = -1;
    if (limit !== -1) dataPagination.push({ $limit: limit });
    const listAssetTypesAggregate = await this.dataService.assetTypes.aggregate(
      [
        { $match: where },
        sort,
        {
          $facet: {
            count: [{ $count: 'count' }],
            data: dataPagination,
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
    const assetType = await this.dataService.assetTypes.findOne({
      assetTypeId: params.id,
    });
    return assetType;
  }

  async createAssetType(createAssetTypeBody: CreateAssetTypeDto) {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const assetTypeId = await Utils.getNextPrefixId(
        this.dataService.counterId,
        PREFIX_ID.ASSET_TYPE,
        session,
      );
      await this.dataService.assetTypes.create(
        {
          ...createAssetTypeBody,
          assetTypeId,
        },
        { session },
      );
      await session.commitTransaction();
      return { success: true };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async updateAssetType(
    params: GetAssetTypeByIdDto,
    newAssetTypeData: EditAssetTypeDto,
  ) {
    await this.dataService.assetTypes.updateOne(
      { assetTypeId: params.id },
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
    await this.dataService.assetTypes.updateOne(
      {
        assetTypeId: params.id,
      },
      {
        $push: {
          specifications: { $each: newSpecifications.specifications },
        },
      },
    );
    return { success: true };
  }

  async editSpecification(
    params: GetAssetTypeByIdDto,
    editedSpecification: EditSpecificationDto,
  ) {
    await this.dataService.assetTypes.updateOne(
      {
        assetTypeId: params.id,
        'specifications._id': editedSpecification.id,
      },
      {
        $set: {
          'specifications.$.label': editedSpecification.newSpecification.label,
          'specifications.$.description':
            editedSpecification.newSpecification.description,
          'specifications.$.required':
            editedSpecification.newSpecification.required,
          'specifications.$.placeholder':
            editedSpecification.newSpecification.placeholder,
        },
      },
    );
    return { success: true };
  }

  async deleteSpecification(
    params: GetAssetTypeByIdDto,
    deletedSpecification: DeleteSpecificationDto,
  ) {
    await this.dataService.assetTypes.updateOne(
      {
        assetTypeId: params.id,
      },
      {
        $pull: { specifications: { _id: deletedSpecification.id } },
      },
    );
    return { success: true };
  }
}
