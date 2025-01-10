import { Injectable, Logger } from '@nestjs/common';
import { ApiError } from 'src/common/api';
import { IDataServices } from 'src/core/abstracts/data-services.abstract';
import {
  ADMIN_STATUS,
  Offer,
  OFFER_STATUS,
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
// import * as randomatic from 'randomatic';
import { Utils } from 'src/common/utils';
import {
  BLOCK_STATUS,
  DEFAULT_LIMIT,
  DEFAULT_OFFET,
  LOCALIZATION,
  SORT_AGGREGATE,
  SPOT_DEX_URL,
} from 'src/common/constants';
import { ListDocument } from 'src/common/common-type';
import { MailService } from 'src/services/mail/mail.service';
import { EmailService, Mail } from 'src/services/email/email.service';
import { EMAIL_CONFIG } from 'src/common/email-config';
import axios from 'axios';
const randomatic = require('randomatic');

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(
    private readonly dataService: IDataServices,
    private readonly userBuilderService: UserBuilderService,
    private readonly mailService: MailService,
    private readonly emailService: EmailService,
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
      walletAddress: Utils.queryInsensitive(createAffiliateDTO.walletAddress),
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
        await this.dataService.offer.updateMany(
          {
            receiverAddress: user[0].walletAddress,
            status: OFFER_STATUS.WATTING,
          },
          { status: OFFER_STATUS.REJECT },
          { session: session },
        );
        await session.commitTransaction();
        user = user[0];
      } catch (error) {
        await session.abortTransaction();
        console.log(error);
        throw error;
      } finally {
        session.endSession();
      }
    } else {
      // update waiting offers to reject
      await this.dataService.offer.updateMany(
        {
          receiverAddress: newAffiliate.walletAddress,
          status: OFFER_STATUS.WATTING,
        },
        { status: OFFER_STATUS.REJECT },
      );
      if (newAffiliate.email) {
        let title = EMAIL_CONFIG.TITLE.BECAME_MASTER_AFFILIATE.EN;
        let template = 'became-master-affiliate_en';
        if (newAffiliate.localization === LOCALIZATION.CN) {
          title = EMAIL_CONFIG.TITLE.BECAME_MASTER_AFFILIATE.CN;
          template = 'became-master-affiliate_cn';
        }
        if (newAffiliate.localization === LOCALIZATION.JP) {
          title = EMAIL_CONFIG.TITLE.BECAME_MASTER_AFFILIATE.JA;
          template = 'became-master-affiliate_ja';
        }
        if (newAffiliate.localization === LOCALIZATION.VN) {
          title = EMAIL_CONFIG.TITLE.BECAME_MASTER_AFFILIATE.VI;
          template = 'became-master-affiliate_vi';
        }
        const localizeUrl = Utils.getPathUrlLocalize(newAffiliate.localization);

        const mail = new Mail(
          EMAIL_CONFIG.FROM_EMAIL,
          newAffiliate.email,
          title,
          {
            userWalletAddress: newAffiliate.walletAddress,
            linkBSC: `${process.env.BSC_SCAN_DOMAIN}/address/${newAffiliate.walletAddress}`,
            commissionRate: newAffiliate.commissionRate,
            dashboardLink: `${process.env.TRADER_DOMAIN}/${localizeUrl}affiliates-dashboard`,
            localization: localizeUrl,
          },
          EMAIL_CONFIG.DIR.AFFILIATE_OFFERS,
          template,
          EMAIL_CONFIG.MAIL_REPLY_TO,
        );
        await this.emailService.sendMailFrac(mail);
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
    const requetBody = {
      wallet: user.walletAddress,
      is_locked: BLOCK_STATUS.BLOCK,
    };
    // Call deactive user to spot dex
    try {
      await axios.put(
        `${process.env.SPOT_DEX_DOMAIN}/${SPOT_DEX_URL.BLOCK_USER}`,
        requetBody,
        {
          headers: { 'API-Key': `${process.env.SPOT_DEX_API_KEY}` },
        },
      );
    } catch {
      this.logger.warn(`User ${user.walletAddress} not async`);
    }

    if (updateUser.email) {
      const data = this.createTemplateDeactivate(updateUser);
      await this.emailService.addQueue(data);
    }

    return updateUser;
  }

  createTemplateDeactivate(user) {
    let template = EMAIL_CONFIG.DIR.DEACTIVATE_TRADER.EN;
    let subject = EMAIL_CONFIG.TITLE.DEACTIVATE_TRADER.EN;
    const contactUs = `${process.env.TRADER_DOMAIN}/${user.localization}/contact-us`;

    if (user.localization === LOCALIZATION.CN) {
      template = EMAIL_CONFIG.DIR.DEACTIVATE_TRADER.CN;
      subject = EMAIL_CONFIG.TITLE.DEACTIVATE_TRADER.CN;
    }
    if (user.localization === LOCALIZATION.JP) {
      template = EMAIL_CONFIG.DIR.DEACTIVATE_TRADER.JA;
      subject = EMAIL_CONFIG.TITLE.DEACTIVATE_TRADER.JP;
    }
    if (user.localization === LOCALIZATION.VN) {
      template = EMAIL_CONFIG.DIR.DEACTIVATE_TRADER.VI;
      subject = EMAIL_CONFIG.TITLE.DEACTIVATE_TRADER.VN;
    }

    return {
      to: user.email,
      from: { name: EMAIL_CONFIG.FROM_EMAIL, address: process.env.MAIL_FROM },
      subject,
      template,
      context: {
        reason: user.deactivatedAffiliateBy.comment,
        contactUs,
        fractorDomain: process.env.FRACTOR_DOMAIN,
        adminDomain: process.env.ADMIN_DOMAIN,
        traderDomain: process.env.TRADER_DOMAIN,
        landingPage: process.env.LANDING_PAGE,
        dexDomain: process.env.DEX_DOMAIN,
      },
    };
  }

  createTemplateActive(user) {
    let template = EMAIL_CONFIG.DIR.REACTIVATE_TRADER.EN;
    let subject = EMAIL_CONFIG.TITLE.REACTIVATE_TRADER.EN;
    const contactUs = `${process.env.TRADER_DOMAIN}/contact-us`;

    if (user.localization === LOCALIZATION.CN) {
      template = EMAIL_CONFIG.DIR.REACTIVATE_TRADER.CN;
      subject = EMAIL_CONFIG.TITLE.REACTIVATE_TRADER.CN;
    }
    if (user.localization === LOCALIZATION.JP) {
      template = EMAIL_CONFIG.DIR.REACTIVATE_TRADER.JA;
      subject = EMAIL_CONFIG.TITLE.REACTIVATE_TRADER.JP;
    }
    if (user.localization === LOCALIZATION.VN) {
      template = EMAIL_CONFIG.DIR.REACTIVATE_TRADER.VI;
      subject = EMAIL_CONFIG.TITLE.REACTIVATE_TRADER.VN;
    }

    return {
      to: user.email,
      from: { name: EMAIL_CONFIG.FROM_EMAIL, address: process.env.MAIL_FROM },
      subject,
      template,
      context: {
        contactUs,
        fractorDomain: process.env.FRACTOR_DOMAIN,
        adminDomain: process.env.ADMIN_DOMAIN,
        traderDomain: `${process.env.TRADER_DOMAIN}/${user.localization}`,
        landingPage: process.env.LANDING_PAGE,
        dexDomain: process.env.DEX_DOMAIN,
      },
    };
  }

  async updateDeactiveUser(
    userId: string,
    deactivateUserDTO: DeactivateUserDTO,
    admin: any,
  ) {
    const user = await this.dataService.user.findOne({
      userId: userId,
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
    const requetBody = {
      wallet: user.walletAddress,
      is_locked: BLOCK_STATUS.UN_BLOCK,
    };
    // Call active user to spot dex
    try {
      await axios.put(
        `${process.env.SPOT_DEX_DOMAIN}/${SPOT_DEX_URL.BLOCK_USER}`,
        requetBody,
        {
          headers: { 'API-Key': `${process.env.SPOT_DEX_API_KEY}` },
        },
      );
    } catch {
      this.logger.warn(`User ${user.walletAddress} not async`);
    }
    if (updateUser.email) {
      const data = this.createTemplateActive(updateUser);
      await this.emailService.addQueue(data);
    }
    return updateUser;
  }

  async getAffiliateDetail(userId: string) {
    let maxCommissionRate;
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
    } else {
      const sub = await this.dataService.offer.aggregate([
        {
          $match: {
            senderAddress: Utils.queryInsensitive(affliate.walletAddress),
            status: { $in: [OFFER_STATUS.ACCEPT, OFFER_STATUS.WATTING] },
          },
        },
        {
          $addFields: { sub1: '$receiverAddress' },
        },
        {
          $project: {
            receiverAddress: 1,
            sub1: 1,
            commissionRate: 1,
          },
        },
        {
          $lookup: {
            from: Offer.name,
            let: { senderAddress: '$sub1' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$$senderAddress', '$senderAddress'] },
                },
              },
              {
                $project: {
                  _id: 1,
                  senderAddress: 1,
                  receiverAddress: 1,
                  commissionRate: 1,
                },
              },
            ],
            as: '_sub1s',
          },
        },
      ]);
      maxCommissionRate = this.getCommissionRateMax(sub);
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
      maxCommissionRate,
    );
    return affiliateDetail;
  }

  getCommissionRateMax(arr) {
    let len = arr.length,
      maxSub1 = -Infinity,
      maxSub2 = -Infinity;
    while (len--) {
      if (arr[len]['commissionRate'] > maxSub1) {
        maxSub1 = arr[len]['commissionRate'];
      }
      let lengSub1 = arr[len]['_sub1s'].length;
      while (lengSub1--) {
        if (arr[len]['_sub1s'][lengSub1]['commissionRate'] > maxSub2) {
          maxSub2 = arr[len]['_sub1s'][lengSub1]['commissionRate'];
        }
      }
    }
    return { maxSub1, maxSub2 };
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
    } else {
      match['role'] = {
        $in: [USER_ROLE.NORMAL],
      };
    }

    if (filter.hasOwnProperty('textSearch')) {
      const textSearch = filter.textSearch.trim();
      Object.assign(match, {
        ...match,
        $or: [
          { userId: Utils.queryInsensitive(textSearch) },
          { email: Utils.queryInsensitive(textSearch) },
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
          email: 1,
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

    const deactivateBy = await this.dataService.admin.findOne({
      adminId: user.deactivatedAffiliateBy?.deactivatedBy,
    });
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
    if (!affiliate) {
      const user = await this.dataService.user.findOneAndUpdate(
        { userId: id },
        {
          $set: {
            'deactivatedAffiliateBy.comment':
              updateAffiliateDTO.deactivationComment,
          },
        },
        { new: true },
      );
      return user?.userId;
    }
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

    await this.dataService.user.findOneAndUpdate(
      {
        userId: id,
      },
      buildAffiliate,
      { new: true },
    );

    // update all sub1 of master when field maxSubSecondCommissionRate changed -> maxSubSecondCommissionRate of sub1 be changed too

    if (
      updateAffiliateDTO.maxSubSecondCommissionRate !==
      affiliate.maxSubSecondCommissionRate
    ) {
      await this.dataService.user.updateMany(
        {
          masterId: id,
          role: USER_ROLE.AFFILIATE_SUB_1,
        },
        {
          maxSubSecondCommissionRate:
            updateAffiliateDTO.maxSubSecondCommissionRate,
        },
      );
    }

    return id;
  }
}
