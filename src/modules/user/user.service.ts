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
import {
  CreateAffiliateDTO,
  DeactivateUserDTO,
  FilterUserDto,
  QUERY_TYPE,
  UpdateAffiliateDTO,
} from './dto/user.dto';
import { UserBuilderService } from './user.factory.service';
import { Role } from 'src/modules/auth/role.enum';
import { InjectConnection } from '@nestjs/mongoose';
import mongoose, { PipelineStage } from 'mongoose';
import * as randomatic from 'randomatic';
import { Utils } from 'src/common/utils';
import {
  DEFAULT_LIMIT,
  DEFAULT_OFFET,
  SORT_AGGREGATE,
} from 'src/common/constants';
import { ListDocument } from 'src/common/common-type';
import { MailService } from 'src/services/mail/mail.service';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(
    private readonly dataService: IDataServices,
    private readonly userBuilderService: UserBuilderService,
    private readonly mailService: MailService,
    @InjectConnection() private readonly connection: mongoose.Connection,
  ) {}

  async createAffiliate(createAffiliateDTO: CreateAffiliateDTO, admin: any) {
    const roleList = [
      USER_ROLE.AFFILIATE_SUB_1,
      USER_ROLE.AFFILIATE_SUB_2,
      USER_ROLE.MASTER_AFFILIATE,
    ];

    const isAdmin = await this.dataService.admin.findOne({
      walletAddress: createAffiliateDTO.walletAddress,
    });
    if (isAdmin) throw ApiError('E39', "This wallet can't be an admin account");

    const affiliate = await this.dataService.user.findOne({
      walletAddress: createAffiliateDTO.walletAddress,
      role: { $in: roleList },
    });
    if (affiliate)
      throw ApiError('E33', 'This wallet has already been in affiliate list');
    if (
      createAffiliateDTO.maxSubFristCommissionRate >=
      createAffiliateDTO.commissionRate
    )
      throw ApiError(
        'E35',
        'maxSubFristCommissionRate must less than master commision rate ',
      );
    if (
      createAffiliateDTO.maxSubSecondCommissionRate >
        createAffiliateDTO.commissionRate ||
      createAffiliateDTO.maxSubSecondCommissionRate >
        createAffiliateDTO.maxSubFristCommissionRate
    )
      throw ApiError(
        'E35',
        'maxSubSecondCommissionRate must be less than commissionRate and maxSubFristCommissionRate',
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
    if (user.email)
      await this.mailService.sendDeactivateAffiliate(
        user.email,
        deactivateUserDTO.comment,
      );

    return updateUser;
  }

  async updateDeactiveUser(
    userId: string,
    deactivateUserDTO: DeactivateUserDTO,
    admin: any,
  ) {
    const user = await this.dataService.user.findOne({
      userId: userId,
      status: USER_STATUS.INACTIVE,
    });
    if (!user) throw ApiError('E2', 'userId is invalid');
    const buildUpdateUser = this.userBuilderService.updateDeactivateUser(
      admin.adminId,
      deactivateUserDTO,
      user,
    );
    const updateUser = await this.dataService.user.findOneAndUpdate(
      {
        userId: userId,
        status: USER_STATUS.INACTIVE,
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
    if (user.email) await this.mailService.sendActiveAffiliate(user.email);
    return updateUser;
  }

  async getAffiliateDetail(userId: string) {
    const affliate = await this.dataService.user.findOne({
      userId,
      role: {
        $in: [
          USER_ROLE.AFFILIATE_SUB_1,
          USER_ROLE.AFFILIATE_SUB_2,
          USER_ROLE.MASTER_AFFILIATE,
        ],
      },
    });
    if (!affliate) throw ApiError('', 'Affiliate is invalid');
    let bdId = affliate.bd;
    if (affliate.role !== USER_ROLE.MASTER_AFFILIATE) {
      const upUser = await this.dataService.user.findOne({
        userId: affliate.masterId,
      });
      bdId = upUser.bd;
    }

    const idList = [
      bdId,
      affliate.createdAffiliateBy?.createdBy,
      affliate.updatedAffiliateBy?.updatedBy,
      affliate.deactivatedAffiliateBy?.deactivatedBy,
    ];
    const admin = await this.dataService.admin.findMany({
      adminId: { $in: idList },
    });
    const bd = admin.find((ad) => ad.adminId === bdId);
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
      bd,
      createdBy: createdBy?.fullname,
      updatedBy: updatedBy?.fullname,
      deactivateBy: deactivateBy?.fullname,
    };
    let uplineAffiliate;
    if (affliate.role === USER_ROLE.AFFILIATE_SUB_1)
      uplineAffiliate = affliate.masterId;
    if (affliate.role === USER_ROLE.AFFILIATE_SUB_2)
      uplineAffiliate = affliate.subFirstId;
    if (uplineAffiliate) {
      uplineAffiliate = await this.dataService.user.findOne({
        userId: uplineAffiliate,
      });
    }
    const affiliateDetail = this.userBuilderService.getAffiliateDetail(
      affliate,
      data,
      uplineAffiliate,
    );
    return affiliateDetail;
  }

  async getAllUsers(filter: FilterUserDto) {
    const { offset, limit } = filter;
    const match: Record<string, any> = {};
    const sort: Record<string, any> = {};
    const pipeline: PipelineStage[] = [];

    if (filter.queryType === QUERY_TYPE.AFFILIATE) {
      match['role'] = {
        $in: [
          USER_ROLE.MASTER_AFFILIATE,
          USER_ROLE.AFFILIATE_SUB_1,
          USER_ROLE.AFFILIATE_SUB_2,
        ],
      };
    }

    if (filter.hasOwnProperty('textSearch')) {
      const textSearch = filter.textSearch.trim();
      Object.assign(match, {
        ...match,
        $or: [
          { userId: Utils.queryInsensitive(textSearch) },
          { emailConfirmed: Utils.queryInsensitive(textSearch) },
          { walletAddress: Utils.queryInsensitive(textSearch) },
        ],
      });
    }

    if (filter.hasOwnProperty('role')) {
      Object.assign(match, {
        ...match,
        role: { $in: [Number(filter.role)] },
      });
    }

    if (filter.hasOwnProperty('status')) {
      Object.assign(match, {
        ...match,
        status: { $in: [Number(filter.status)] },
      });
    }
    pipeline.push(
      {
        $addFields: {
          emailConfirmed: {
            $cond: {
              if: { $eq: ['$isEmailConfirmed', true] },
              then: '$email',
              else: null,
            },
          },
        },
      },
      {
        $match: match,
      },
      {
        $addFields: {
          date: {
            $cond: {
              if: '$createdAffiliateBy',
              then: '$createdAffiliateBy.createdAt',
              else: '$timeAcceptOffer',
            },
          },
        },
      },
      {
        $project: {
          userId: 1,
          createdAt: 1,
          walletAddress: 1,
          role: 1,
          status: 1,
          emailConfirmed: 1,
          createdAffiliateBy: 1,
          masterId: 1,
          subFirstId: 1,
          timeAcceptOffer: 1,
          date: 1,
        },
      },
    );

    if (filter.sortField && filter.sortType) {
      sort[filter.sortField] = filter.sortType;
    } else {
      if (filter.queryType === QUERY_TYPE.AFFILIATE)
        sort['date'] = SORT_AGGREGATE.DESC;
      else sort['createdAt'] = SORT_AGGREGATE.DESC;
    }

    const $facet: any = {
      count: [{ $count: 'totalItem' }],
      items: [
        { $sort: sort },
        { $skip: offset || DEFAULT_OFFET },
        { $limit: limit || DEFAULT_LIMIT },
      ],
    };

    pipeline.push({ $facet });

    const data = await this.dataService.user.aggregate(pipeline, {
      collation: { locale: 'en_US', strength: 1 },
    });

    const [result] = data;
    const [total] = result.count;
    const items = result.items.map((item) => {
      if (item.role === USER_ROLE.MASTER_AFFILIATE)
        item.timeAcceptOffer = item.createdAffiliateBy?.createdAt;
      return item;
    });
    return {
      totalDocs: total ? total.totalItem : 0,
      docs: items || [],
    } as ListDocument;
  }

  async getUserDetail(userId: string) {
    const user = await this.dataService.user.findOne({ userId });
    if (!user) throw ApiError('', 'User not found');
    const referedBy: User = await this.dataService.user.findOne({
      walletAddress: user?.referedBy,
    });
    let deactivateBy = null;
    if (user.status === USER_STATUS.INACTIVE) {
      deactivateBy = await this.dataService.admin.findOne({
        adminId: user.deactivatedAffiliateBy?.deactivatedBy,
      });
    }
    const data = {
      referedBy,
      deactivateBy,
    };
    const userDetail = this.userBuilderService.getUserDetail(user, data);
    return userDetail;
  }

  async randomReferal() {
    const referral = randomatic('Aa0', Math.floor(Math.random() * 3) + 7);
    const userExisted = await this.dataService.user.findOne({
      referalCode: referral,
    });
    if (!userExisted) return referral;

    return await this.randomReferal();
  }

  async updateAffiliate(updateAffiliateDTO: UpdateAffiliateDTO, admin, id) {
    const affiliate = await this.dataService.user.findOne({
      userId: id,
      role: USER_ROLE.MASTER_AFFILIATE,
    });
    if (!affiliate) throw ApiError('', 'This wallet is invalid');
    const sub1 = await this.dataService.user.findOne({
      userId: affiliate.subFirstId,
    });
    if (sub1 && updateAffiliateDTO.commissionRate <= sub1.commissionRate)
      throw ApiError(
        'E35',
        'Master commission rate must greater than current commision rate of sub1 ',
      );
    if (
      updateAffiliateDTO.maxSubFristCommissionRate >=
      updateAffiliateDTO.commissionRate
    )
      throw ApiError(
        'E35',
        'maxSubFristCommissionRate must less than master commision rate ',
      );
    if (
      updateAffiliateDTO.maxSubSecondCommissionRate >
        updateAffiliateDTO.commissionRate ||
      updateAffiliateDTO.maxSubSecondCommissionRate >
        updateAffiliateDTO.maxSubFristCommissionRate
    )
      throw ApiError(
        'E35',
        'maxSubSecondCommissionRate must be less than commissionRate and maxSubFristCommissionRate',
      );

    if (updateAffiliateDTO.bd) {
      const admin = await this.dataService.admin.findOne({
        adminId: updateAffiliateDTO.bd,
        status: ADMIN_STATUS.ACTIVE,
        role: Role.MasterBD,
      });
      if (!admin) throw ApiError('E4', 'bd is invalid');
    }

    const buildAffiliate = this.userBuilderService.updateAffiliate(
      updateAffiliateDTO,
      admin,
    );

    const newAffiliate = await this.dataService.user.findOneAndUpdate(
      {
        userId: id,
      },
      buildAffiliate,
      { new: true },
    );

    return id;
  }
}
