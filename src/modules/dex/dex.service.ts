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

  async getAffiliateFee(walletAddress: string): Promise<AffiliateFeeEntity[]> {
    return [
      {
        role: 1,
        walletAddress: '0x779361Af4503C1eaA52baf64c01C013842eB87f1',
        feeReceive: 10,
      },
      {
        role: 2,
        walletAddress: '0x83eF7DEA9c0eD0CadE9Aed85702540CF5254c095',
        feeReceive: 10,
      },
      {
        role: 3,
        walletAddress: '0xFf7Dcc7131958e5fDa7976BeE585947730e43fCf',
        feeReceive: 10,
      }
    ];
  }
}
