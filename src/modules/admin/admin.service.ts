import { ForbiddenException, Injectable } from '@nestjs/common';
import { DEFAULT_LIMIT, DEFAULT_OFFET, ErrorCode } from 'src/common/constants';
import { IDataServices } from 'src/core/abstracts/data-services.abstract';
import { get } from 'lodash';
import { ObjectId } from 'mongodb';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { CreateAdminDto, FilterAdminDto, UpdateAdminDto } from './dto/admin.dto';
import { ListDocument } from 'src/common/common-type';
import { AdminBuilderService } from './admin.factory.service';
import { ApiError } from 'src/common/api';
import * as randomatic from 'randomatic';
import { Role } from '../auth/role.enum';
import { ADMIN_STATUS } from 'src/datalayer/model';

@Injectable()
export class AdminService {
  constructor(
    private readonly dataServices: IDataServices,
    private readonly adminBuilderService: AdminBuilderService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async getListAdmin(user: any, filter: FilterAdminDto) {
    const query: any = {
      _id: { $ne: new ObjectId(user._id) },
      deleted: false,
    };

    if (filter.name) {
      query['$or'] = [
        { fullname: { $regex: filter.name.trim(), $options: 'i' } },
        { walletAddress: { $regex: filter.name.trim(), $options: 'i' } },
      ];
    }

    if (filter.role) {
      const filterRoles = filter.role.split(',');
      const roles: any = filterRoles.map((e) => parseInt(e));
      query['role'] = { $in: roles };
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
        $project: {
          adminId: 1,
          fullname: 1,
          role: 1,
          walletAddress: 1,
          status: 1,
          createdAt: 1,
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
    const response = this.adminBuilderService.convertAdmins(data);
    const count = get(dataQuery, [0, 'count', 0, 'count']) || 0;

    return {
      totalDocs: count,
      docs: response || [],
    } as ListDocument;
  }

  async createAdmin(user: any, data: CreateAdminDto) {
    if (data.role == Role.SuperAdmin && user.role !== Role.OWNER)
      throw new ForbiddenException('Forbidden');

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const admin = await this.dataServices.admin.findOne({
        email: data.email,
        walletAddress: data.walletAddress,
        deleted: false,
      });
      if (admin)
        throw ApiError(ErrorCode.EMAIL_EXISTED, 'Email already exists');

      // create referral
      const referral = await this.randomReferal();

      const adminObj = await this.adminBuilderService.createAdmin(
        data,
        user.adminId,
        referral,
        session,
      );
      const newAdmin = await this.dataServices.admin.create(adminObj, {
        session,
      });
      await session.commitTransaction();
      return newAdmin;
    } catch (error) {
      await session.abortTransaction();
      throw ApiError('', 'Cannot create admin');
    } finally {
      session.endSession();
    }
  }

  async update(id: string, user: any, data: UpdateAdminDto) {
    const filter = {
      _id: id,
      status: ADMIN_STATUS.ACTIVE,
      deleted: false,
    };

    const currentAdmin = await this.dataServices.admin.findOne(filter);
    if (!currentAdmin) throw ApiError(ErrorCode.DEFAULT_ERROR, 'Id not already exists');

    const isEmail = await this.dataServices.admin.findOne({ email: data.email });
    if (isEmail) throw ApiError(ErrorCode.EMAIL_EXISTED, 'Email already exists');

    const updateAdminObj = await this.adminBuilderService.updateAddmin(
      data,
      user.adminId,
    );

    return await this.dataServices.admin.findOneAndUpdate(filter, updateAdminObj, { new: true });
  }

  async getDetail(id: string, user: any) {
    const filter = {
      _id: id,
      deleted: false,
    };

    const currentAdmin = await this.dataServices.admin.findOne(filter);
    if (!currentAdmin) throw ApiError(ErrorCode.DEFAULT_ERROR, 'Id not already exists');

    // create adminIds
    let adminIds = [currentAdmin.createBy, currentAdmin.lastUpdateBy];
    adminIds = [...new Set(adminIds)];

    const relatedAdminList = await this.dataServices.admin.findMany({ adminId: { $in: adminIds } }, { adminId: 1, fullname: 1 });
    if (!relatedAdminList.length) throw ApiError(ErrorCode.DEFAULT_ERROR, 'related Admin List not already exists');

    return await this.adminBuilderService.convertAdminDetail(currentAdmin, relatedAdminList);
  }

  async randomReferal() {
    const referral = randomatic('Aa0', Math.floor(Math.random() * 3) + 7);
    const userExisted = await this.dataServices.admin.findOne({ referral });
    if (!userExisted) return referral;

    return await this.randomReferal();
  }
}
