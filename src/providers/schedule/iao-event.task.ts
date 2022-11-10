import { IDataServices } from 'src/core/abstracts/data-services.abstract';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  VAULT_TYPE,
  ON_CHAIN_STATUS,
  IAO_EVENT_STATUS,
} from 'src/datalayer/model';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { MailService } from 'src/services/mail/mail.service';

@Injectable()
export class IAOEventTask {
  private readonly logger = new Logger(IAOEventTask.name);
  constructor(
    private readonly dataService: IDataServices,
    private readonly mailService: MailService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  @Cron(CronExpression.EVERY_SECOND)
  async handleCron() {
    this.logger.debug('start scan iao event to update status of asset');
    const nowDate = new Date();
    const iaoEvent = await this.dataService.iaoEvent.findMany({
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
          vaultUnlockThreshold:{$lte:'$totalSupply' + '$availableSupply'}
        },
      ],
    });
    console.log(iaoEvent.length);
  }
}
