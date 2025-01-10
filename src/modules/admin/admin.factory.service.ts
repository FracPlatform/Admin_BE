import { Injectable } from '@nestjs/common';
import { Utils } from 'src/common/utils';
import { IDataServices } from 'src/core/abstracts/data-services.abstract';
import { PREFIX_ID } from 'src/common/constants';
import {
  AdminDetailEntity,
  AdminEntity,
  InformationAdmin,
  ListAdminEntity,
} from 'src/entity';
import { ADMIN_STATUS } from 'src/datalayer/model';
import { CreateAdminDto, UpdateAdminDto } from './dto/admin.dto';

@Injectable()
export class AdminBuilderService {
  constructor(private readonly dataServices: IDataServices) {}

  async createAdmin(
    data: CreateAdminDto,
    currentAdminId,
    referral,
    session,
  ): Promise<AdminEntity> {
    const asset: AdminEntity = {
      email: data.email,
      fullname: data.name,
      description: data.description,
      walletAddress: data.walletAddress,
      role: data.role,
      status: ADMIN_STATUS.INACTIVE,
      referral,
      createBy: currentAdminId,
      lastUpdateBy: currentAdminId,
      deleted: false,
      adminId: await Utils.getNextPrefixId(
        this.dataServices.counterId,
        PREFIX_ID.ADMIN,
        session,
      ),
      commissionRate: data.commissionRate,
    };
    return asset;
  }

  updateAddmin(data: UpdateAdminDto, currentAdminId) {
    const dataUpdate = {
      email: data?.email,
      fullname: data?.name,
      description: data?.description,
      lastUpdateBy: currentAdminId,
      commissionRate: data?.commissionRate,
    };
    return dataUpdate;
  }

  convertAdmins(data) {
    return data.map((e) => {
      const admin: ListAdminEntity = {
        _id: e._id,
        email: e.email,
        fullname: e.fullname,
        description: e.description,
        walletAddress: e.walletAddress,
        role: e.role,
        status: e.status,
        referral: e.referral,
        createBy: e.createBy,
        lastUpdateBy: e.lastUpdateBy,
        deleted: e.deleted,
        adminId: e.adminId,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
      };
      return admin;
    });
  }

  convertAdminDetail(data, relatedAdminList: any) {
    const admin: AdminDetailEntity = {
      _id: data._id,
      email: data.email,
      fullname: data.fullname,
      description: data.description,
      walletAddress: data.walletAddress,
      role: data.role,
      status: data.status,
      referral: data.referral,
      adminCreated: relatedAdminList.find(
        (adminInfo) => adminInfo.adminId == data.createBy,
      ),
      adminUpdated: relatedAdminList.find(
        (adminInfo) => adminInfo.adminId == data.lastUpdateBy,
      ),
      adminId: data.adminId,
      deleted: data.deleted,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      commissionRate: data.commissionRate,
    };
    return admin;
  }

  createInformationAdmin(data) {
    const information: InformationAdmin = {
      email: data.email,
      fullname: data.fullname,
      description: data.description,
      adminId: data.adminId,
      role: data.role,
      commissionRate: data.commissionRate,
    };
    return information;
  }
}
