import { IDataServices } from 'src/core/abstracts/data-services.abstract';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  VAULT_TYPE,
  ON_CHAIN_STATUS,
  IAO_EVENT_STATUS,
  ASSET_STATUS,
} from 'src/datalayer/model';

@Injectable()
export class IAOEventTask {
  private readonly logger = new Logger(IAOEventTask.name);
  constructor(private readonly dataService: IDataServices) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleCron() {
    this.logger.debug('Start job scan iao event to update status of asset');
    const nowDate = new Date();
    let iaoEvent: any = await this.dataService.iaoEvent.findMany({
      $or: [
        {
          vaultType: VAULT_TYPE.NON_VAULT,
          participationEndTime: { $lte: nowDate },
          onChainStatus: ON_CHAIN_STATUS.ON_CHAIN,
          status: IAO_EVENT_STATUS.ACTIVE,
        },
        {
          vaultType: VAULT_TYPE.VAULT,
          participationEndTime: { $lte: nowDate },
          onChainStatus: ON_CHAIN_STATUS.ON_CHAIN,
          status: IAO_EVENT_STATUS.ACTIVE,
          $expr: {
            $gte: [
              { $subtract: ['$totalSupply', '$availableSupply'] },
              {
                $multiply: ['$vaultUnlockThreshold', '$totalSupply', 0.01],
              },
            ],
          },
        },
      ],
    });
    const iaoRequestIdList = iaoEvent.map((iao) => iao.iaoRequestId);

    const iaoRequest = await this.dataService.iaoRequest.findMany({
      iaoId: iaoRequestIdList,
    });
    let items = [];
    iaoRequest.forEach((iao) => {
      if (iao.items) items = items.concat(iao.items);
    });
    const updateAsset = await this.dataService.asset.updateMany(
      { itemId: { $in: items } },
      { status: ASSET_STATUS.EXCHANGE },
    );
    if (updateAsset)
      this.logger.debug('End job scan iao event to update status of asset');
  }
}
