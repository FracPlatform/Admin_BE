import { Injectable } from '@nestjs/common';
import { ApiError } from 'src/common/api';
import { IDataServices } from 'src/core/abstracts/data-services.abstract';
import {
  ADMIN_STATUS,
  MAX_MASTER_COMMISION_RATE,
  USER_ROLE,
} from 'src/datalayer/model';
import { CreateAffiliateDTO } from './dto/user.dto';
import { UserBuilderService } from './user.factory.service';
import { Role } from 'src/modules/auth/role.enum';
import { InjectConnection } from '@nestjs/mongoose';
import mongoose from 'mongoose';
@Injectable()
export class UserService {
  constructor(
    private readonly dataService: IDataServices,
    private readonly userBuilderService: UserBuilderService,
    @InjectConnection() private readonly connection: mongoose.Connection,
  ) {}

  async createAffiliate(createAffiliateDTO: CreateAffiliateDTO) {
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

    const buildAffiliate =
      this.userBuilderService.createAffiliate(createAffiliateDTO);

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
}
