import { Injectable } from '@nestjs/common';
import { Utils } from '../../common/utils';
import { IDataServices } from '../../core/abstracts/data-services.abstract';
import { FilterFractorDto } from './dto/filter-fractor.dto';
import { get } from 'lodash';
import { ListDocument } from '../../common/common-type';
import { UpdateFractorDto } from './dto/update-fractor.dto';
import { ApiError } from '../../common/api';
import { Admin, Fractor } from '../../datalayer/model';
import { Role } from '../auth/role.enum';
import { DeactiveDto } from './dto/active-deactive-fractor.dto';

@Injectable()
export class FractorService {
  constructor(private readonly dataServices: IDataServices) {}

  async editFractorById(
    admin: Admin,
    fractorId: string,
    data: UpdateFractorDto,
  ) {
    this._validateRoleEditFractor(admin.role, data);

    const fractor = await this.dataServices.fractor.findOne({
      fractorId: fractorId,
    });
    if (!fractor) throw ApiError('', 'Fractor not exists');

    await this._validateDataWhenUpdateFractor(fractor, data);

    const updateFractorData = {
      ...data,
      lastUpdatedBy: admin.adminId,
    };

    // set default value of fee if blank
    if (admin.role === Role.OWNER || admin.role === Role.SuperAdmin) {
      if (!Object.keys(data).includes('iaoFeeRate')) {
        updateFractorData['iaoFeeRate'] = 0;
      }
      if (!Object.keys(data).includes('tradingFeeProfit')) {
        updateFractorData['tradingFeeProfit'] = 0;
      }
    }

    const updateStatus = await this.dataServices.fractor.findOneAndUpdate(
      { fractorId: fractorId, updatedAt: fractor['updatedAt'] },
      {
        $set: updateFractorData,
      },
    );
    if (!updateStatus) {
      throw ApiError('', "Can't update fractor");
    }
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
            let: { assignedBD: '$assignedBD' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$adminId', '$$assignedBD'] },
                },
              },
              { $project: { adminId: 1, fullname: 1 } },
            ],
            as: 'assignedBD',
          },
        },
        {
          $lookup: {
            from: 'Admin',
            let: { lastUpdatedBy: '$lastUpdatedBy' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$adminId', '$$lastUpdatedBy'] },
                },
              },
              { $project: { adminId: 1, fullname: 1 } },
            ],
            as: 'lastUpdatedBy',
          },
        },
        {
          $lookup: {
            from: 'Admin',
            let: { deactivatedBy: '$deactivatedBy' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$adminId', '$$deactivatedBy'] },
                },
              },
              { $project: { adminId: 1, fullname: 1 } },
            ],
            as: 'deactivatedBy',
          },
        },
        {
          $unwind: {
            path: '$assignedBD',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $unwind: {
            path: '$lastUpdatedBy',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $unwind: {
            path: '$deactivatedBy',
            preserveNullAndEmptyArrays: true,
          },
        },
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
      const matchOrCondition: any = [
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
      ];

      const bdIds = await this._filterAdminIdByName(filter.textSearch.trim());

      if (bdIds.length > 0) {
        matchOrCondition.push({
          assignedBD: {
            $in: bdIds,
          },
        });
      }

      match = {
        $or: matchOrCondition,
      };
    }
    if (Object.keys(filter).includes('status')) {
      match.isBlocked = !filter.status;
    }

    const agg = [];

    agg.push(
      {
        $match: match,
      },
      {
        $lookup: {
          from: 'Admin',
          let: { assignedBD: '$assignedBD' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$adminId', '$$assignedBD'] },
              },
            },
            { $project: { adminId: 1, fullname: 1 } },
          ],
          as: 'assignedBD',
        },
      },
      {
        $unwind: {
          path: '$assignedBD',
          preserveNullAndEmptyArrays: true,
        },
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

    const dataReturnFilter = [sort, { $skip: filter.offset || 0 }];
    if (filter.limit !== -1)
      dataReturnFilter.push({ $limit: filter.limit || 10 });
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

  async deactiveFractor(admin: Admin, fractorId: string, data: DeactiveDto) {
    const fractor = await this.dataServices.fractor.findOne({
      fractorId: fractorId,
    });
    if (!fractor) throw ApiError('', 'Fractor not exists');

    const updateStatus = await this.dataServices.fractor.findOneAndUpdate(
      { fractorId: fractorId, updatedAt: fractor['updatedAt'] },
      {
        isBlocked: true,
        lastUpdatedBy: admin.adminId,
        deactivationComment: data.deactivationComment,
        deactivatedBy: admin.adminId,
        deactivetedOn: new Date(),
      },
    );
    if (!updateStatus) {
      throw ApiError('', 'Fractor already deactive');
    }
  }

  async activeFractor(admin: Admin, fractorId: string) {
    const fractor = await this.dataServices.fractor.findOne({
      fractorId: fractorId,
    });
    if (!fractor) throw ApiError('', 'Fractor not exists');

    const updateStatus = await this.dataServices.fractor.findOneAndUpdate(
      { fractorId: fractorId, updatedAt: fractor['updatedAt'] },
      {
        isBlocked: false,
        lastUpdatedBy: admin.adminId,
      },
    );
    if (!updateStatus) {
      throw ApiError('', 'Fractor already active');
    }
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

  private async _validateDataWhenUpdateFractor(
    fractor: Fractor,
    data: UpdateFractorDto,
  ) {
    if (
      fractor.isBlocked &&
      !Object.keys(data).includes('deactivationComment')
    ) {
      throw ApiError('', 'deactivationComment is require');
    }
    if (data.assignedBD) {
      if (Object.keys(data).includes('assignedBD')) {
        const admin = await this.dataServices.admin.findOne({
          adminId: data.assignedBD,
        });
        if (!admin) {
          throw ApiError('', 'Not found BD');
        }

        if (admin.role !== Role.FractorBD) {
          throw ApiError('', 'Only assign to BD of fractor');
        }
      }
    }
  }

  private _validateRoleEditFractor(role: number, data: UpdateFractorDto) {
    if (
      (Object.keys(data).includes('iaoFeeRate') ||
        Object.keys(data).includes('tradingFeeProfit') ||
        Object.keys(data).includes('deactivationComment')) &&
      role === Role.HeadOfBD
    ) {
      throw ApiError(
        '',
        'Only super admin can edit fee and deactivationComment',
      );
    }
  }
}
