import { IDataServices } from 'src/core/abstracts/data-services.abstract';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Utils } from 'src/common/utils';

@Injectable()
export class ExchangeRateTask {
  private readonly logger = new Logger(ExchangeRateTask.name);
  constructor(private readonly dataService: IDataServices) {}

  @Cron('0 */15 * * * *')
  async handleCron() {
    try {
      const data = await this.dataService.exchangeRate.findMany({});
      const convertData = data.map((token) => token.contractAddress);
      const stringData = convertData.join(',');
      const exchangeRate = await Utils.getCurrentPriceFromContract(stringData);
      const updateExchangeRate = [];
      for (const key in exchangeRate) {
        updateExchangeRate.push(
          this.dataService.exchangeRate.updateOne(
            { contractAddress: Utils.queryInsensitive(key) },
            {
              exchangeRate: exchangeRate[key]['usd'],
              stringExchangeRate: Utils.convertNumberToNoExponents(
                exchangeRate[key]['usd'],
              ),
            },
          ),
        );
      }
      await Promise.all(updateExchangeRate);
    } catch (err) {
      this.logger.error(err);
      this.logger.error(err?.stack);
    }
  }
}
