import { Injectable } from '@nestjs/common';
import { PREFIX_ID } from 'src/common/constants';
import { Utils } from 'src/common/utils';
import { IDataServices } from 'src/core/abstracts/data-services.abstract';
import { User, USER_ROLE, USER_STATUS } from 'src/datalayer/model';
import {
  CreateAffiliateDTO,
  DeactivateUserDTO,
  UpdateAffiliateDTO,
} from './dto/user.dto';

@Injectable()
export class UserBuilderService {
  constructor(private readonly dataService: IDataServices) {}

  createAffiliate(
    createAffiliateDTO: CreateAffiliateDTO,
    user: any,
    referalCode,
  ) {
    return {
      walletAddress: createAffiliateDTO.walletAddress,
      commissionRate: createAffiliateDTO.commissionRate,
      maxSubFristCommissionRate: createAffiliateDTO.maxSubFristCommissionRate,
      maxSubSecondCommissionRate: createAffiliateDTO.maxSubSecondCommissionRate,
      bd: createAffiliateDTO.bd,
      referalCode,
      role: USER_ROLE.MASTER_AFFILIATE,
      createdAffiliateBy: {
        createdAt: new Date(),
        createdBy: user.adminId,
      },
    };
  }

  updateAffiliate(updateDto: UpdateAffiliateDTO, user: any) {
    return {
      commissionRate: updateDto.commissionRate,
      maxSubFristCommissionRate: updateDto.maxSubFristCommissionRate,
      maxSubSecondCommissionRate: updateDto.maxSubSecondCommissionRate,
      bd: updateDto.bd,
      description: updateDto.description,
      updatedAffiliateBy: {
        updatedAt: new Date(),
        updatedBy: user.adminId,
      },
      'deactivatedAffiliateBy.comment': updateDto.deactivationComment,
    };
  }

  async createUser(
    createAffiliateDTO: CreateAffiliateDTO,
    session,
    user: any,
    referalCode,
  ) {
    return {
      walletAddress: createAffiliateDTO.walletAddress,
      status: USER_STATUS.ACTIVE,
      userId: await Utils.getNextPrefixId(
        this.dataService.counterId,
        PREFIX_ID.USER,
        session,
      ),
      commissionRate: createAffiliateDTO.commissionRate,
      maxSubFristCommissionRate: createAffiliateDTO.maxSubFristCommissionRate,
      maxSubSecondCommissionRate: createAffiliateDTO.maxSubSecondCommissionRate,
      bd: createAffiliateDTO.bd,
      referalCode,
      role: USER_ROLE.MASTER_AFFILIATE,
      createdAffiliateBy: {
        createdAt: new Date(),
        createdBy: user.adminId,
      },
    };
  }

  deactivateUser(adminId: string, deactivateUserDTO: DeactivateUserDTO) {
    return {
      status: USER_STATUS.INACTIVE,
      comment: deactivateUserDTO.comment,
      deactivatedAffiliateBy: {
        deactivatedAt: new Date(),
        deactivatedBy: adminId,
        comment: deactivateUserDTO.comment,
      },
      updatedAffiliateBy: {
        updatedAt: new Date(),
        updatedBy: adminId,
      },
    };
  }

  updateDeactivateUser(
    adminId: string,
    deactivateUserDTO: DeactivateUserDTO,
    user: any,
  ) {
    return {
      deactivatedAffiliateBy: {
        deactivatedAt: user.deactivatedAffiliateBy.deactivatedAt,
        deactivatedBy: user.deactivatedAffiliateBy.deactivatedBy,
        comment: deactivateUserDTO.comment,
      },
      updatedAffiliateBy: {
        updatedAt: new Date(),
        updatedBy: adminId,
      },
    };
  }

  activeUser(adminId: string) {
    return {
      status: USER_STATUS.ACTIVE,
      updatedAffiliateBy: {
        updatedAt: new Date(),
        updatedBy: adminId,
      },
    };
  }

  getAffiliateDetail(user: User, data: any, uplineAffiliate: User) {
    return {
      userId: user.userId,
      joinedOn: user.createdAt,
      walletAddress: user.walletAddress,
      status: user.status,
      role: user.role,
      commissionRate: user.commissionRate,
      maxSubFristCommissionRate: user.maxSubFristCommissionRate,
      maxSubSecondCommissionRate: user.maxSubSecondCommissionRate,
      bd: user.bd ? { adminId: user.bd, fullname: data.bd } : null,
      createdAffiliateBy: {
        adminId: user.createdAffiliateBy?.createdBy,
        fullname: data.createdBy,
        createdAt: user.createdAffiliateBy?.createdAt,
      },
      updatedAffiliateBy: {
        adminId: user.updatedAffiliateBy?.updatedBy,
        fullname: data.updatedBy,
        createdAt: user.updatedAffiliateBy?.updatedAt,
      },
      deactivatedAffiliateBy: {
        adminId: user.deactivatedAffiliateBy?.deactivatedBy,
        fullname: data.deactivateBy,
        createdAt: user.deactivatedAffiliateBy?.deactivatedAt,
        comment: user.deactivatedAffiliateBy?.comment,
      },
      referralLink: user.referalCode,
      email: user.email,
      description: user.description,
      uplineAffiliate: {
        userId: uplineAffiliate?.userId || null,
        wallet: uplineAffiliate?.walletAddress || null,
        rank: uplineAffiliate?.role || null,
        commissionRate: uplineAffiliate?.commissionRate || null,
      },
    };
  }

  getUserDetail(user: User, data: any) {
    return {
      userId: user.userId,
      joinedOn: user.createdAt,
      walletAddress: user.walletAddress,
      status: user.status,
      role: user.role,
      affiliate: data.referedBy
        ? {
            userId: data.referedBy.userId,
            walletAddress: data.referedBy.walletAddress,
            role: data.referedBy.role,
            commissionRate: data.referedBy.commissionRate,
          }
        : null,
      deactivatedUserBy: data.deactivateBy
        ? {
            adminId: user.deactivatedAffiliateBy.deactivatedBy,
            fullname: data.deactivateBy.fullname,
            createdAt: user.deactivatedAffiliateBy.deactivatedAt,
            comment: user.deactivatedAffiliateBy?.comment,
          }
        : null,
      email: user.email,
      description: user.description,
    };
  }
}
