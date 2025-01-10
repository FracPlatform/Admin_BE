import { Injectable, Logger } from '@nestjs/common';
import { ApiError } from 'src/common/api';
import { Utils } from 'src/common/utils';
import { IDataServices } from 'src/core/abstracts/data-services.abstract';
import {
  CreateTieringPoolDto,
  UpdateTieringPoolDto,
} from './dto/tiering-pool.dto';

@Injectable()
export class TieringPoolService {
  private readonly logger = new Logger(TieringPoolService.name);

  constructor(private readonly dataServices: IDataServices) {}

  async createTieringPool(data: CreateTieringPoolDto) {
    const tierPool = await this.dataServices.tieringPool.findOne({
      tieringPoolId: data._poolId,
    });
    const { currencySymbol, currencyDecimal } = await Utils.getCurrencySymbol(
      data._stakingToken,
    );
    if (!tierPool) {
      const tierPoolData = {
        tieringPoolId: data._poolId,
        poolContractAddress: process.env.CONTRACT_DIAMOND_ALPHA,
        tieringTokenAddress: data._stakingToken,
        lockDuration: data._lockDuration,
        withdrawDelayDuration: data._withdrawDelayDuration,
        tieringTokenSymbol: currencySymbol,
        tieringTokenDecimal: currencyDecimal,
      };
      await this.dataServices.tieringPool.create(tierPoolData);
    } else {
      await this.dataServices.tieringPool.updateOne(
        { tieringPoolId: data._poolId },
        {
          $set: {
            tieringTokenAddress: data._stakingToken,
            lockDuration: data._lockDuration,
            withdrawDelayDuration: data._withdrawDelayDuration,
            tieringTokenSymbol: currencySymbol,
            tieringTokenDecimal: currencyDecimal,
          },
        },
      );
    }
    this.logger.warn(`Successfully for create tiering pool ${data._poolId} `);
  }

  async updateTierPool(body: UpdateTieringPoolDto) {
    const tierPool = await this.dataServices.tieringPool.findOne({});
    if (!tierPool) throw ApiError('', 'Tier pool not found');
    await this.dataServices.tieringPool.findOneAndUpdate(
      { tieringPoolId: tierPool.tieringPoolId },
      { tieringPoolStatus: body.tieringPoolStatus },
    );
    return tierPool;
  }

  async getTieringPool() {
    const tierPool = await this.dataServices.tieringPool.findOne({});
    if (!tierPool) throw ApiError('', 'Tier pool not found');
    return tierPool;
  }
}
