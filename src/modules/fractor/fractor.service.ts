import { Injectable } from '@nestjs/common';
import { Utils } from '../../common/utils';
import { IDataServices } from '../../core/abstracts/data-services.abstract';
import { FilterFractorDto } from './dto/filter-fractor.dto';
import { get } from 'lodash';
import { ListDocument } from '../../common/common-type';
import { UpdateFractorDto } from './dto/update-fractor.dto';
import { ApiError } from '../../common/api';
import { Fractor } from '../../datalayer/model';

@Injectable()
export class FractorService {
  constructor(private readonly dataServices: IDataServices) {}

  async editFractorById(fractorId: string, data: UpdateFractorDto) {
    const fractor = await this.dataServices.fractor.findOne({
      fractorId: fractorId,
    });
    if (!fractor) throw ApiError('', 'Fractor not exists');

    const validation = await this._validateDataWhenUpdateFractor(fractor, data);
    if (!validation.valid) throw ApiError('', validation.message);

    await this.dataServices.fractor.updateOne(
      { fractorId: fractorId },
      {
        $set: data,
      },
    );
    return { success: true };
  }

  async getFractorById(fractorId: string) {
    const dataQuery = await this.dataServices.fractor.aggregate(
      [
        {
          $match: {
            fractorId: fractorId,
          },
        },
        {
          $lookup: {
            from: 'Admin',
            localField: 'assignedBD',
            foreignField: 'adminId',
            pipeline: [{ $project: { _id: 1, fullname: 1, adminId: 1 } }],
            as: 'assignedBDInfor',
          },
        },
        {
          $project: {
            password: 0,
            verificationCode: 0,
            verificationCodeExpireTime: 0,
            assignedBDInfor: { $arrayElemAt: ['$assignedBDInfor', 0] },
          },
        },
      ],
      {
        collation: { locale: 'en' },
      },
    );
    return dataQuery;
  }

  async filterFractor(filter: FilterFractorDto) {
    let match: Record<string, any> = {};
    if (filter.textSearch) {
      match = {
        $or: [
          {
            email: {
              $regex: Utils.escapeRegex(filter.textSearch.trim()),
              $options: 'i',
            },
          },
          {
            fullname: {
              $regex: Utils.escapeRegex(filter.textSearch.trim()),
              $options: 'i',
            },
          },
          {
            fractorId: {
              $regex: Utils.escapeRegex(filter.textSearch.trim()),
              $options: 'i',
            },
          },
          {
            assignedBD: {
              $regex: Utils.escapeRegex(filter.textSearch.trim()),
              $options: 'i',
            },
          },
        ],
      };
    }

    const bdIds = await this._filterAdminIdByName(filter.textSearch.trim());

    if (bdIds.length > 0) {
      match.assignedBD = {
        $in: bdIds,
      };
    }

    if (filter.status) {
      match.isBlocked = !filter.status;
    }

    const agg = [];

    agg.push(
      {
        $match: match,
      },
      {
        $project: {
          password: 0,
          verificationCode: 0,
          verificationCodeExpireTime: 0,
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
      { $skip: filter.offset || 0 },
      { $limit: filter.limit || 10 },
    ];
    agg.push({
      $facet: {
        count: [{ $count: 'count' }],
        data: dataReturnFilter,
      },
    });

    const dataQuery = await this.dataServices.fractor.aggregate(agg, {
      collation: { locale: 'en' },
    });

    const data = get(dataQuery, [0, 'data']);
    const count = get(dataQuery, [0, 'count', 0, 'count']) || 0;

    return {
      totalDocs: count,
      docs: data || [],
    } as ListDocument;
  }

  private async _filterAdminIdByName(name: string): Promise<string[]> {
    const data = await this.dataServices.admin.aggregate(
      [
        {
          $match: {
            fullname: {
              $regex: Utils.escapeRegex(name.trim()),
              $options: 'i',
            },
          },
        },
        {
          $project: {
            adminId: 1,
            _id: 0,
          },
        },
      ],
      {
        collation: { locale: 'en' },
      },
    );
    const ids = [];
    data.forEach((e: { adminId: string }) => {
      ids.push(e.adminId);
    });
    return ids;
  }

  private _validateDataWhenUpdateFractor(
    fractor: Fractor,
    data: UpdateFractorDto,
  ): { valid: boolean; message: string } {
    if (!fractor.isBlocked && data.deactivationComment !== '') {
      return {
        valid: false,
        message: "Can't edit deactivation comment of fractor is active",
      };
    }
    return {
      valid: true,
      message: '',
    };
  }
}
