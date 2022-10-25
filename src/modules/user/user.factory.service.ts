import { Injectable } from '@nestjs/common';
import { USER_ROLE } from 'src/datalayer/model';
import { CreateAffiliateDTO } from './dto/user.dto';

Injectable();
export class UserBuilderService {
  createAffiliate(createAffiliateDTO: CreateAffiliateDTO) {
    return {
      walletAddress: createAffiliateDTO.walletAddress,
      masterCommissionRate: createAffiliateDTO.masterCommissionRate,
      maxSubFristCommissionRate: createAffiliateDTO.maxSubFristCommissionRate,
      maxSubSecondCommissionRate: createAffiliateDTO.maxSubSecondCommissionRate,
      bd: createAffiliateDTO.bd,
      role: USER_ROLE.MASTER_AFFILIATE,
    };
  }
}
