import { Injectable } from '@nestjs/common';
import {
  DEFAULT_LIMIT,
  DEFAULT_OFFET,
  ErrorCode,
  PREFIX_ID,
} from 'src/common/constants';
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
import { SearchSpecificationsDto } from './dto/search-specifications.dto';
import {
  CheckDuplicateNameDto,
  CheckDuplicateSpecificationDto,
  LANGUAGE,
} from './dto/check-duplicate-name.dto';
import { ApiError } from 'src/common/api';

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
    if (keyword)
      where['$or'] = [
        {
          'name.en': {
            $regex: Utils.escapeRegex(keyword.trim()),
            $options: 'i',
          },
        },
        {
          assetTypeId: {
            $regex: Utils.escapeRegex(keyword.trim()),
            $options: 'i',
          },
        },
      ];
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
    if (createAssetTypeBody.name.en)
      await this.checkDuplicateName({
        lang: LANGUAGE.EN,
        name: createAssetTypeBody.name.en,
      });
    if (createAssetTypeBody.name.ja)
      await this.checkDuplicateName({
        lang: LANGUAGE.JA,
        name: createAssetTypeBody.name.ja,
      });
    if (createAssetTypeBody.name.cn)
      await this.checkDuplicateName({
        lang: LANGUAGE.CN,
        name: createAssetTypeBody.name.cn,
      });

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

  async checkDuplicateName(filter: CheckDuplicateNameDto) {
    const property = `name.${filter.lang}`;
    const query = { [property]: filter.name.toUpperCase() };

    const asseetType = await this.dataService.assetTypes.aggregate([
      {
        $project: {
          'name.en': { $toUpper: '$name.en' },
          'name.ja': { $toUpper: '$name.ja' },
          'name.cn': { $toUpper: '$name.cn' },
        },
      },
      {
        $match: query,
      },
    ]);
    if (asseetType.length)
      throw ApiError(ErrorCode.FIELD_EXISTED, 'name existed');
    return { isDuplicate: false };
  }

  async checkDuplicateSpecification(
    params: GetAssetTypeByIdDto,
    filter: CheckDuplicateSpecificationDto,
  ) {
    const property = `specifications.label.${filter.lang}`;
    const query = { [property]: filter.label.toUpperCase() };
    const asseetType = await this.dataService.assetTypes.aggregate([
      {
        $match: {
          assetTypeId: params.id,
        },
      },
      { $unwind: '$specifications' },
      {
        $project: {
          'specifications.label.en': { $toUpper: '$specifications.label.en' },
          'specifications.label.ja': { $toUpper: '$specifications.label.ja' },
          'specifications.label.cn': { $toUpper: '$specifications.label.cn' },
        },
      },
      {
        $match: query,
      },
    ]);
    if (asseetType.length)
      throw ApiError(ErrorCode.FIELD_EXISTED, 'label existed');
    return { isDuplicate: false };
  }

  async searchSpecifications(
    params: GetAssetTypeByIdDto,
    filter: SearchSpecificationsDto,
  ) {
    const query = {};
    if (filter.keyword)
      query['$or'] = [
        {
          'specifications.label.en': {
            $regex: Utils.escapeRegex(filter.keyword.trim()),
            $options: 'i',
          },
        },
        {
          'specifications.description.en': {
            $regex: Utils.escapeRegex(filter.keyword.trim()),
            $options: 'i',
          },
        },
      ];
    const res = await this.dataService.assetTypes.aggregate([
      { $match: { assetTypeId: params.id } },
      { $unwind: { path: '$specifications' } },
      {
        $match: query,
      },
      {
        $group: {
          _id: '$_id',
          specifications: { $push: '$specifications' },
        },
      },
      {
        $project: { _id: 0 },
      },
    ]);
    return res.length ? res[0].specifications : res;
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
    if (newSpecifications.specifications[0].label.en)
      await this.checkDuplicateSpecification(params, {
        lang: LANGUAGE.EN,
        label: newSpecifications.specifications[0].label.en,
      });
    if (newSpecifications.specifications[0].label.ja)
      await this.checkDuplicateSpecification(params, {
        lang: LANGUAGE.JA,
        label: newSpecifications.specifications[0].label.ja,
      });
    if (newSpecifications.specifications[0].label.cn)
      await this.checkDuplicateSpecification(params, {
        lang: LANGUAGE.CN,
        label: newSpecifications.specifications[0].label.cn,
      });
    const assetType = await this.dataService.assetTypes.findOne({
      assetTypeId: params.id,
    });
    await this.dataService.assetTypes.updateOne(
      {
        assetTypeId: params.id,
        updatedAt: assetType['updatedAt'],
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
    const assetType = await this.dataService.assetTypes.findOne({
      assetTypeId: params.id,
    });
    const toEditSpecification = assetType.specifications.find(
      (specification) =>
        specification['_id'].toString() === editedSpecification.id,
    );
    if (
      editedSpecification.newSpecification.label.en &&
      toEditSpecification.label.en.toUpperCase() !==
        editedSpecification.newSpecification.label.en.toUpperCase()
    ) {
      await this.checkDuplicateSpecification(params, {
        lang: LANGUAGE.EN,
        label: editedSpecification.newSpecification.label.en,
      });
    }
    if (
      editedSpecification.newSpecification.label.ja &&
      toEditSpecification.label.ja.toUpperCase() !==
        editedSpecification.newSpecification.label.ja.toUpperCase()
    ) {
      await this.checkDuplicateSpecification(params, {
        lang: LANGUAGE.JA,
        label: editedSpecification.newSpecification.label.ja,
      });
    }
    if (
      editedSpecification.newSpecification.label.cn &&
      toEditSpecification.label.cn.toUpperCase() !==
        editedSpecification.newSpecification.label.cn.toUpperCase()
    ) {
      await this.checkDuplicateSpecification(params, {
        lang: LANGUAGE.CN,
        label: editedSpecification.newSpecification.label.cn,
      });
    }

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
