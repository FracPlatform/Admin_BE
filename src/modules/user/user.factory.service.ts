import { Injectable } from '@nestjs/common';
import { PREFIX_ID } from 'src/common/constants';
import { Utils } from 'src/common/utils';
import { IDataServices } from 'src/core/abstracts/data-services.abstract';
import { USER_ROLE, USER_STATUS } from 'src/datalayer/model';
import { CreateAffiliateDTO, DeactivateUserDTO } from './dto/user.dto';

@Injectable()
export class UserBuilderService {
  constructor(private readonly dataService: IDataServices) {}

  createAffiliate(createAffiliateDTO: CreateAffiliateDTO, user: any) {
    return {
      walletAddress: createAffiliateDTO.walletAddress,
      masterCommissionRate: createAffiliateDTO.masterCommissionRate,
      maxSubFristCommissionRate: createAffiliateDTO.maxSubFristCommissionRate,
      maxSubSecondCommissionRate: createAffiliateDTO.maxSubSecondCommissionRate,
      bd: createAffiliateDTO.bd,
      role: USER_ROLE.MASTER_AFFILIATE,
      createdAffiliateBy: {
        createdAt: new Date(),
        createdBy: user.adminId,
      },
    };
  }

  async createUser(createAffiliateDTO: CreateAffiliateDTO, session, user: any) {
    return {
      walletAddress: createAffiliateDTO.walletAddress,
      status: USER_STATUS.ACTIVE,
      userId: await Utils.getNextPrefixId(
        this.dataService.counterId,
        PREFIX_ID.USER,
        session,
      ),
      masterCommissionRate: createAffiliateDTO.masterCommissionRate,
      maxSubFristCommissionRate: createAffiliateDTO.maxSubFristCommissionRate,
      maxSubSecondCommissionRate: createAffiliateDTO.maxSubSecondCommissionRate,
      bd: createAffiliateDTO.bd,
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

  activeUser(adminId: string) {
    return {
      status: USER_STATUS.ACTIVE,
      updatedAffiliateBy: {
        updatedAt: new Date(),
        updatedBy: adminId,
      },
    };
  }
}
