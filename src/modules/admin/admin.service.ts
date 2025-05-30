import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { DEFAULT_LIMIT, DEFAULT_OFFET, ErrorCode } from 'src/common/constants';
import { IDataServices } from 'src/core/abstracts/data-services.abstract';
import { get } from 'lodash';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import {
  CreateAdminDto,
  FilterAdminDto,
  UpdateAdminDto,
} from './dto/admin.dto';
import { ListDocument } from 'src/common/common-type';
import { AdminBuilderService } from './admin.factory.service';
import { ApiError } from 'src/common/api';
// import * as randomatic from 'randomatic';
import { Role } from '../auth/role.enum';
import { Admin, ADMIN_STATUS } from 'src/datalayer/model';
import { Web3ETH } from '../../blockchain/web3.eth';

const randomatic = require('randomatic');

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly dataServices: IDataServices,
    private readonly adminBuilderService: AdminBuilderService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async getListAdmin(user: any, filter: FilterAdminDto) {
    const query: any = {
      deleted: false,
    };

    if (filter.name) {
      query['$or'] = [
        { fullname: { $regex: filter.name.trim(), $options: 'i' } },
        { walletAddress: { $regex: filter.name.trim(), $options: 'i' } },
      ];
    }

    if (filter.role) {
      this._validateFilterRole(user, filter.role);
      const filterRoles = filter.role.split(',');
      const roles: any = filterRoles.map((e) => parseInt(e));
      query['role'] = { $in: roles };
    } else {
      if ([Role.HeadOfBD, Role.OperationAdmin].some((e) => e === user.role)) {
        query['role'] = { $in: [Role.HeadOfBD, Role.FractorBD, Role.MasterBD] };
      } else {
        query['role'] = {
          $in: [
            Role.Deactive,
            Role.SuperAdmin,
            Role.OperationAdmin,
            Role.HeadOfBD,
            Role.FractorBD,
            Role.MasterBD,
          ],
        };
      }
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

    const dataReturnFilter = [sort, { $skip: filter.offset || DEFAULT_OFFET }];

    if (filter.limit !== -1)
      dataReturnFilter.push({ $limit: filter.limit || DEFAULT_LIMIT });

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

    // validate if role is bd of affiliate
    if (data.role === Role.MasterBD && !data.commissionRate) {
      throw ApiError(
        ErrorCode.DEFAULT_ERROR,
        'commissionRate must require when role is bd of affiliate',
      );
    }

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      // create referral
      const referral = [Role.FractorBD].includes(data.role)
        ? await this.randomReferal()
        : null;

      const web3Service = new Web3ETH();
      data.walletAddress = web3Service.toChecksumAddress(data.walletAddress);

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
      this.logger.debug(error.message);
      throw error;
    } finally {
      session.endSession();
    }
  }

  async update(id: string, user: any, data: UpdateAdminDto) {
    const filter = {
      adminId: id,
      deleted: false,
    };

    const currentAdmin = await this.dataServices.admin.findOne(filter);
    if (!currentAdmin)
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'Id not already exists');

    if (currentAdmin.role == Role.OWNER && user.role !== Role.OWNER)
      throw new ForbiddenException('Forbidden');

    const updateAdminObj = await this.adminBuilderService.updateAddmin(
      data,
      user.adminId,
    );

    return await this.dataServices.admin.findOneAndUpdate(
      {
        ...filter,
        updatedAt: currentAdmin['updatedAt'],
      },
      updateAdminObj,
      { new: true },
    );
  }

  async getDetail(user: any, id: string) {
    const filter = {
      adminId: id,
      deleted: false,
    };

    const currentAdmin = await this.dataServices.admin.findOne(filter);
    if (!currentAdmin)
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'Id not already exists');

    if (
      [Role.HeadOfBD, Role.OperationAdmin].some((e) => e === user.role) &&
      [Role.HeadOfBD, Role.FractorBD, Role.MasterBD].every(
        (e) => e !== currentAdmin.role,
      )
    ) {
      throw new ForbiddenException(
        "You can't see admin role: Super Admin, Operation Admin",
      );
    }

    // create adminIds
    let adminIds = [currentAdmin.createBy, currentAdmin.lastUpdateBy];
    adminIds = [...new Set(adminIds)];

    const relatedAdminList = await this.dataServices.admin.findMany(
      { adminId: { $in: adminIds } },
      { adminId: 1, fullname: 1 },
    );
    if (!relatedAdminList.length)
      throw ApiError(
        ErrorCode.DEFAULT_ERROR,
        'related Admin List not already exists',
      );

    return await this.adminBuilderService.convertAdminDetail(
      currentAdmin,
      relatedAdminList,
    );
  }

  async getInforAdmin(id: string) {
    const filter = {
      adminId: id,
      status: ADMIN_STATUS.ACTIVE,
      deleted: false,
    };

    const currentAdmin = await this.dataServices.admin.findOne(filter);
    if (!currentAdmin)
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'Id not already exists');

    return await this.adminBuilderService.createInformationAdmin(currentAdmin);
  }

  async randomReferal() {
    const referral = randomatic('Aa0', Math.floor(Math.random() * 3) + 7);
    const userExisted = await this.dataServices.admin.findOne({ referral });
    if (!userExisted) return referral;

    return await this.randomReferal();
  }

  async deleteAdmin(caller: Admin, adminId: string) {
    const admin = await this.dataServices.admin.findOne({ adminId: adminId });
    if (admin.role === Role.SuperAdmin && caller.role !== Role.OWNER) {
      throw new ForbiddenException(
        'Only owner contract can delete Super Admin',
      );
    }
    if (admin.role === Role.OWNER) {
      throw ApiError('', 'Not found admin');
    }
    await this.dataServices.admin.updateOne(
      { adminId: adminId },
      {
        $set: {
          deleted: true,
        },
      },
    );
    return;
  }

  private _validateFilterRole(user: any, filterRoles: string) {
    if ([Role.HeadOfBD, Role.OperationAdmin].some((e) => e === user.role)) {
      const roles = filterRoles.split(',');

      roles.forEach((role) => {
        if (
          ![
            Role.SuperAdmin.toString(),
            Role.OperationAdmin.toString(),
            Role.HeadOfBD.toString(),
            Role.FractorBD.toString(),
            Role.MasterBD.toString(),
          ].includes(role)
        ) {
          throw ApiError(ErrorCode.INVALID_ROLE_ADMIN, 'role is invalid');
        }
      });

      if (
        roles.includes(Role.OWNER.toString()) ||
        roles.includes(Role.SuperAdmin.toString()) ||
        roles.includes(Role.OperationAdmin.toString())
      ) {
        throw new ForbiddenException(
          "You can't filter admin role: Super Admin, Operation Admin",
        );
      }
    }
  }
}
