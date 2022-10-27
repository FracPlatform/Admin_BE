import { Injectable, Logger } from '@nestjs/common';
import { ApiError } from 'src/common/api';
import { IDataServices } from 'src/core/abstracts/data-services.abstract';
import {
  ADMIN_STATUS,
  MAX_MASTER_COMMISION_RATE,
  User,
  USER_ROLE,
  USER_STATUS,
} from 'src/datalayer/model';
import { CreateAffiliateDTO, DeactivateUserDTO } from './dto/user.dto';
import { UserBuilderService } from './user.factory.service';
import { Role } from 'src/modules/auth/role.enum';
import { InjectConnection } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import * as randomatic from 'randomatic';

@Injectable()
export class UserService {
  constructor(
    private readonly dataService: IDataServices,
    private readonly userBuilderService: UserBuilderService,
    @InjectConnection() private readonly connection: mongoose.Connection,
  ) {}

  async createAffiliate(createAffiliateDTO: CreateAffiliateDTO, admin: any) {
    const roleList = [
      USER_ROLE.AFFILIATE_SUB_1,
      USER_ROLE.AFFILIATE_SUB_2,
      USER_ROLE.MASTER_AFFILIATE,
    ];
    const affiliate = await this.dataService.user.findOne({
      walletAddress: createAffiliateDTO.walletAddress,
      role: { $in: roleList },
    });
    if (affiliate)
      throw ApiError('E33', 'This wallet has already been in affiliate list');
    if (
      createAffiliateDTO.maxSubFristCommissionRate >= MAX_MASTER_COMMISION_RATE
    )
      throw ApiError(
        'E35',
        'maxSubFristCommissionRate must less than master commision rate ',
      );
    if (
      createAffiliateDTO.maxSubSecondCommissionRate >
        createAffiliateDTO.masterCommissionRate ||
      createAffiliateDTO.maxSubSecondCommissionRate >
        createAffiliateDTO.maxSubFristCommissionRate
    )
      throw ApiError(
        'E35',
        'maxSubSecondCommissionRate must be less than masterCommissionRate and maxSubFristCommissionRate',
      );

    if (createAffiliateDTO.bd) {
      const admin = await this.dataService.admin.findOne({
        adminId: createAffiliateDTO.bd,
        status: ADMIN_STATUS.ACTIVE,
        role: Role.MasterBD,
      });
      if (!admin) throw ApiError('E4', 'bd is invalid');
    }

    const referralCode = await this.randomReferal();

    const buildAffiliate = this.userBuilderService.createAffiliate(
      createAffiliateDTO,
      admin,
      referralCode,
    );

    const newAffiliate = await this.dataService.user.findOneAndUpdate(
      {
        walletAddress: createAffiliateDTO.walletAddress,
      },
      buildAffiliate,
      { new: true },
    );
    let user;
    if (!newAffiliate) {
      // create new user
      const session = await this.connection.startSession();
      session.startTransaction();
      try {
        const buildUser = await this.userBuilderService.createUser(
          createAffiliateDTO,
          session,
          admin,
          referralCode,
        );
        user = await this.dataService.user.create(buildUser);
        await session.commitTransaction();
        user = user[0];
      } catch (error) {
        await session.abortTransaction();
        console.log(error);
        throw error;
      } finally {
        session.endSession();
      }
    }

    return newAffiliate ? newAffiliate : user;
  }

  async deactiveUser(
    userId: string,
    deactivateUserDTO: DeactivateUserDTO,
    admin: any,
  ) {
    const user = await this.dataService.user.findOne({
      userId: userId,
      status: USER_STATUS.ACTIVE,
    });
    if (!user) throw ApiError('E2', 'userId is invalid');
    const buildUpdateUser = this.userBuilderService.deactivateUser(
      admin.adminId,
      deactivateUserDTO,
    );
    const updateUser = await this.dataService.user.findOneAndUpdate(
      {
        userId: userId,
        status: USER_STATUS.ACTIVE,
      },
      { $set: buildUpdateUser },
      { new: true },
    );
    return updateUser;
  }

  async activeUser(userId: string, admin) {
    const user = await this.dataService.user.findOne({
      userId: userId,
      status: USER_STATUS.INACTIVE,
    });
    if (!user) throw ApiError('E2', 'userId is invalid');
    const buildUser = this.userBuilderService.activeUser(admin.adminId);
    const updateUser = await this.dataService.user.findOneAndUpdate(
      {
        userId: userId,
        status: USER_STATUS.INACTIVE,
      },
      { $set: buildUser },
      { new: true },
    );
    return updateUser;
  }

  async getAffiliateDetail(userId: string) {
    const affliate = await this.dataService.user.findOne({ userId });
    const idList = [
      affliate.bd,
      affliate.createdAffiliateBy?.createdBy,
      affliate.updatedAffiliateBy?.updatedBy,
      affliate.deactivatedAffiliateBy?.deactivatedBy,
    ];
    const admin = await this.dataService.admin.findMany({
      adminId: { $in: idList },
    });
    const bd = admin.find((ad) => ad.adminId === affliate.bd);
    const createdBy = admin.find(
      (ad) => ad.adminId === affliate.createdAffiliateBy?.createdBy,
    );
    const updatedBy = admin.find(
      (ad) => ad.adminId === affliate.updatedAffiliateBy?.updatedBy,
    );
    const deactivateBy = admin.find(
      (ad) => ad.adminId === affliate.deactivatedAffiliateBy?.deactivatedBy,
    );
    const data = {
      bd: bd?.fullname,
      createdBy: createdBy.fullname,
      updatedBy: updatedBy.fullname,
      deactivateBy: deactivateBy.fullname,
    };
    const affiliateDetail = this.userBuilderService.getAffiliateDetail(
      affliate,
      data,
    );
    return affiliateDetail;
  }

  async getUserDetail(userId: string) {
    const user = await this.dataService.user.findOne({ userId });
    if (!user) throw ApiError('', 'User not found');
    const referedBy: User = await this.dataService.user.findOne({
      walletAddress: user?.referedBy,
    });
    let commissionRate = 0;
    let deactivateBy = null;
    if (user.status === USER_STATUS.INACTIVE) {
      deactivateBy = await this.dataService.admin.findOne({
        adminId: user.deactivatedAffiliateBy?.deactivatedBy,
      });
    }
    if (referedBy) {
      commissionRate = this._getCommissionRateAffiliate(referedBy);
    }
    const data = {
      commissionRate,
      referedBy,
      deactivateBy,
    };
    const userDetail = this.userBuilderService.getUserDetail(user, data);
    return userDetail;
  }

  private _getCommissionRateAffiliate(affiliate: User): number {
    switch (affiliate.role) {
      case USER_ROLE.MASTER_AFFILIATE:
        return affiliate.masterCommissionRate;
      case USER_ROLE.AFFILIATE_SUB_1:
        return affiliate.maxSubFristCommissionRate;
      case USER_ROLE.AFFILIATE_SUB_2:
        return affiliate.maxSubSecondCommissionRate;
    }
  }

  async randomReferal() {
    const referral = randomatic('Aa0', Math.floor(Math.random() * 3) + 7);
    const userExisted = await this.dataService.user.findOne({
      referalCode: referral,
    });
    if (!userExisted) return referral;

    return await this.randomReferal();
  }
}
