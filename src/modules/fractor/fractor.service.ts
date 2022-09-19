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
  }

  async getFractorById(fractorId: string) {
    const dataQuery = await this.dataServices.fractor.aggregate(
      [
        {
          $match: {
            fractorId: fractorId,
          },
        },
        // {
        //   $lookup: {
        //     from: 'Fractor',
        //     let: { items: '$fractor' },
        //     pipeline: [
        //       { $project: { _id: 1, name: 1, previewUrl: 1 } },
        //     ],
        //     as: 'items',
        //   },
        // },
        {
          $project: {
            password: 0,
            verificationCode: 0,
            verificationCodeExpireTime: 0,
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
    const data = await this.dataServices.fractor.aggregate(
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
            fractorId: 1,
            _id: 0,
          },
        },
      ],
      {
        collation: { locale: 'en' },
      },
    );
    const ids = [];
    data.forEach((e: { fractorId: string }) => {
      ids.push(e.fractorId);
    });
    return ids;
  }

  private _validateDataWhenUpdateFractor(fractor: Fractor, data: UpdateFractorDto) {

  }
}
