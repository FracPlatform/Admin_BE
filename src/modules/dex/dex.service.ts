import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApiError } from 'src/common/api';
import { ErrorCode } from 'src/common/constants';
import { IDataServices } from 'src/core/abstracts/data-services.abstract';
import { AffiliateFeeEntity, FractorFeeEntity } from 'src/entity/dex.entity';

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

  async getAffiliateFee(walletAddress: string): Promise<AffiliateFeeEntity> {
    return {
      commissionRate: 10,
      maxCommissionRateForSub1: 10,
      maxCommissionRateForSub2: 10,
    };
  }
}
