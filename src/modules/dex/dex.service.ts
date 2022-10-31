import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApiError } from 'src/common/api';
import { ErrorCode } from 'src/common/constants';
import { IDataServices } from 'src/core/abstracts/data-services.abstract';
import { AffiliateFeeEntity, FractorFeeEntity } from 'src/entity/dex.entity';
import { Web3ETH } from '../../blockchain/web3.eth';
import { USER_ROLE } from '../../datalayer/model';

@Injectable()
export class DexService {
  constructor(
    private readonly dataService: IDataServices,
    private readonly jwtService: JwtService,
  ) {}

  async getFractorFeeById(id: string): Promise<FractorFeeEntity> {
    const fractor = await this.dataService.fractor.findOne({
      fractorId: id,
    });
    if (!fractor)
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'Fractor does not exists');
    return {
      iaoFeeRate: fractor.iaoFeeRate,
      tradingFeeProfit: fractor.tradingFeeProfit,
    };
  }

  async generateToken() {
    const payload = { name: 'Dex', role: '' };
    const token = this.jwtService.sign(payload, {
      secret: process.env.JWT_DEX_SECRET,
    });
    return { token };
  }

  async getAffiliateFee(walletAddress: string): Promise<AffiliateFeeEntity[]> {
    const res = [];
    const web3Service = new Web3ETH();
    const user = await this.dataService.user.findOne({
      walletAddress: web3Service.toChecksumAddress(walletAddress),
    });
    const affiliateOfUser = await this.dataService.user.findOne({
      walletAddress: user.referedBy,
    });
    if (!affiliateOfUser) {
      return res;
    }
    if (affiliateOfUser.role === USER_ROLE.MASTER_AFFILIATE) {
      res.push({
        role: affiliateOfUser.role,
        walletAddress: affiliateOfUser.walletAddress,
        feeReceive: affiliateOfUser.commissionRate,
      });
    } else if (affiliateOfUser.role === USER_ROLE.AFFILIATE_SUB_1) {
      let masterAffiliate = await this.dataService.user.findOne({
        walletAddress: affiliateOfUser.masterId,
      });
      // rate for sub1
      res.push({
        role: affiliateOfUser.role,
        walletAddress: affiliateOfUser.walletAddress,
        feeReceive: affiliateOfUser.commissionRate,
      });
      // rate for master affiliate
      res.push({
        role: masterAffiliate.role,
        walletAddress: masterAffiliate.walletAddress,
        feeReceive:
          masterAffiliate.commissionRate - affiliateOfUser.commissionRate,
      });
    } else if (affiliateOfUser.role === USER_ROLE.AFFILIATE_SUB_2) {
      let masterAffiliate = await this.dataService.user.findOne({
        walletAddress: affiliateOfUser.masterId,
      });
      let sub1Affiliate = await this.dataService.user.findOne({
        walletAddress: affiliateOfUser.subFirstId,
      });
      // rate for sub1
      res.push({
        role: sub1Affiliate.role,
        walletAddress: sub1Affiliate.walletAddress,
        feeReceive:
          sub1Affiliate.commissionRate - affiliateOfUser.commissionRate,
      });
      // rate for sub2
      res.push({
        role: affiliateOfUser.role,
        walletAddress: affiliateOfUser.walletAddress,
        feeReceive: affiliateOfUser.commissionRate,
      });
      // rate for master affiliate
      res.push({
        role: masterAffiliate.role,
        walletAddress: masterAffiliate.walletAddress,
        feeReceive:
          masterAffiliate.commissionRate -
          affiliateOfUser.commissionRate -
          sub1Affiliate.commissionRate,
      });
    }
    return res;
  }
}
