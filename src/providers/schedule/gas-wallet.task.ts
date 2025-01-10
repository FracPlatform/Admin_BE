import { get } from 'lodash';
import { GasWallet } from './../../datalayer/model/settings.model';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EMAIL_CONFIG } from 'src/common/email-config';
import { IDataServices } from 'src/core/abstracts/data-services.abstract';
import { SETTINGS_NAME_DEFAULT, WALLET_TYPE } from 'src/datalayer/model';
import { EmailService, Mail } from 'src/services/email/email.service';
import { SocketGateway } from '../socket/socket.gateway';
import { Web3Gateway } from 'src/blockchain/web3.gateway';
import { GAS_WALLET } from 'src/common/constants';
@Injectable()
export class GasWalletTask {
  private readonly logger = new Logger(GasWalletTask.name);
  constructor(
    private readonly dataServices: IDataServices,
    private readonly emailService: EmailService,
    private readonly socketGateway: SocketGateway,
  ) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  async handleCron() {
    try {
      const { gasWallet: walletSetting } =
        await this.dataServices.settings.findOne({
          settingsName: SETTINGS_NAME_DEFAULT,
        });

      if (!walletSetting.mailNotified.length) return;

      const wallets = await this.dataServices.gasWalletModel.findMany({});
      for (const wallet of wallets) {
        if (wallet.walletType === WALLET_TYPE.DEX) {
          const currentBalance = await this._getBalanceWallet(
            process.env.CHAIN_ID,
            wallet.walletAddress,
          );
          currentBalance <= walletSetting.minThresholdDEX &&
            (await this._sendMailNotified(
              walletSetting.mailNotified,
              GAS_WALLET.DEX,
              wallet.walletAddress,
              currentBalance,
              walletSetting.minThresholdDEX,
            ));
        }

        if (wallet.walletType === WALLET_TYPE.IAO) {
          // check balance in BSC
          const currentBalanceBSC = await this._getBalanceWallet(
            process.env.CHAIN_ID,
            wallet.walletAddress,
          );
          currentBalanceBSC <= walletSetting.minThresholdIAO_BSC &&
            (await this._sendMailNotified(
              walletSetting.mailNotified,
              GAS_WALLET.IAO_BSC,
              wallet.walletAddress,
              currentBalanceBSC,
              walletSetting.minThresholdIAO_BSC,
            ));
          // check balance in ETH
          // const currentBalanceETH = await this._getBalanceWallet(
          //   process.env.CHAIN_ETH_ID,
          //   wallet.walletAddress,
          // );
          // currentBalanceETH <= walletSetting.minThresholdIAO_ETH &&
          //   (await this._sendMailNotified(
          //     walletSetting.mailNotified,
          //     GAS_WALLET.IAO_ETH,
          //     wallet.walletAddress,
          //     currentBalanceETH,
          //     walletSetting.minThresholdIAO_ETH,
          //     'ETH',
          //   ));
        }
      }
    } catch (err) {
      this.logger.error(err);
      this.logger.error(err?.stack);
    }
  }

  private async _sendMailNotified(
    mails: string[],
    gaswallet: string,
    walletAddress: string,
    currentBalance: number,
    minThreshold: number,
    currency: string = 'BNB',
  ) {
    const walletAddressLink =
      gaswallet === GAS_WALLET.IAO_ETH
        ? `${process.env.ETH_SCAN_DOMAIN}/address/${walletAddress}`
        : `${process.env.BSC_SCAN_DOMAIN}/address/${walletAddress}`;
    const context = {
      gasWallet: gaswallet,
      walletAddress: walletAddress,
      walletAddressLink: walletAddressLink,
      currentBalance: currentBalance,
      minThreshold: minThreshold,
      currency,
    };

    const mail = new Mail(
      EMAIL_CONFIG.FROM_EMAIL,
      mails,
      EMAIL_CONFIG.TITLE.GAS_WALLET,
      context,
      EMAIL_CONFIG.DIR.GAS_WALLET,
      'GW',
      EMAIL_CONFIG.MAIL_REPLY_TO,
    );
    await this.emailService.sendMailFrac(mail);
  }

  private async _getBalanceWallet(chainId: string, address: string) {
    const web3Gateway = new Web3Gateway(+chainId);
    const balance = await web3Gateway.getBalance(address);
    return Number(balance);
  }
}
