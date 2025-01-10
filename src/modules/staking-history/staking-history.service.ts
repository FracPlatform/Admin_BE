import { Injectable, Logger } from '@nestjs/common';
import BigNumber from 'bignumber.js';
import { STAKING_TYPE } from 'src/common/constants';
import { Utils } from 'src/common/utils';
import { IDataServices } from 'src/core/abstracts/data-services.abstract';
import { StakingInfoDto } from './dto/staking-history.dto';

@Injectable()
export class StakingHistoryService {
  private readonly logger = new Logger(StakingHistoryService.name);

  constructor(private readonly dataServices: IDataServices) {}

  async getCurrentBalance(walletAddress: string) {
    const currentBalance = await this.dataServices.stakingHistory.findOne(
      {
        walletAddress,
      },
      null,
      { sort: { createdAt: -1 }, limit: 1 },
    );
    return currentBalance?.balance ?? '0';
  }

  async unStaking(stakingInfo: StakingInfoDto) {
    const { tieringTokenDecimal: decimals } =
      await this.dataServices.tieringPool.findOne({});

    const balance = await this.getCurrentBalance(stakingInfo.walletAddress);
    const value = new BigNumber(stakingInfo.value)
      .dividedBy(Math.pow(10, decimals))
      .toString();
    let newBalance = '0';
    if (
      balance &&
      new BigNumber(balance)
        .minus(new BigNumber(stakingInfo.value))
        .comparedTo(0)
    ) {
      newBalance = new BigNumber(balance)
        .minus(new BigNumber(value))
        .toString();
    }
    return await this.dataServices.stakingHistory.create({
      walletAddress: stakingInfo.walletAddress,
      balance: Utils.convertNumberToNoExponents(newBalance),
      value,
      type: STAKING_TYPE.UNSTAKING,
      transactionHash: stakingInfo.transactionHash,
    });
  }

  async staking(stakingInfo: StakingInfoDto) {
    const { tieringTokenDecimal: decimals } =
      await this.dataServices.tieringPool.findOne({});

    const value = new BigNumber(stakingInfo.value)
      .dividedBy(Math.pow(10, decimals))
      .toString();

    const balance = await this.getCurrentBalance(stakingInfo.walletAddress);

    const newBalance = new BigNumber(value)
      .plus(new BigNumber(balance))
      .toString();

    return await this.dataServices.stakingHistory.create({
      walletAddress: stakingInfo.walletAddress,
      balance: Utils.convertNumberToNoExponents(newBalance),
      value,
      type: STAKING_TYPE.STAKING,
      transactionHash: stakingInfo.transactionHash,
    });
  }
}
