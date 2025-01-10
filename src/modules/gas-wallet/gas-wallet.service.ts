import { Injectable } from '@nestjs/common';
import { SetGasWalletDTO } from '../signer/dto/signer.dto';
import { IDataServices } from 'src/core/abstracts/data-services.abstract';
import { ApiError } from 'src/common/api';
import { Web3Gateway } from 'src/blockchain/web3.gateway';
import { AwsUtils } from 'src/common/aws.util';
import { WALLET_TYPE } from 'src/datalayer/model';

@Injectable()
export class GasWalletService {
  constructor(private readonly dataService: IDataServices) {}

  async createGasWallet(payload: SetGasWalletDTO) {
    try {
      if (payload.secretKey !== process.env.SECRET_KEY_SIGNER) {
        throw ApiError('', 'Secret key is invalid');
      }
      const network = +process.env.CHAIN_ID;
      const gasWallet = await this.dataService.gasWalletModel.findOne({
        chain: network,
        walletType: payload.type,
      });
      const web3Gateway = new Web3Gateway(+process.env.CHAIN_ID);
      const account = await web3Gateway.createAccount();
      const hashKey = await AwsUtils.encrypt(account['privateKey']);
      if (!gasWallet) {
        const result = await this.dataService.gasWalletModel.create({
          walletAddress: account['address'],
          hashKey: hashKey,
          chain: network,
          walletType: payload.type,
        });
        return result[0].walletAddress;
      } else {
        // if exist private key in env, update hash key
        if (process.env.PRIVATE_KEY_GAS_WALLET_IAO || process.env.PRIVATE_KEY_GAS_WALLET_DEX) {
          let privateKey = process.env.PRIVATE_KEY_GAS_WALLET_IAO;
          if (payload.type === WALLET_TYPE.DEX) {
            privateKey = process.env.PRIVATE_KEY_GAS_WALLET_DEX;
          }
          const wallet = await this.dataService.gasWalletModel.findOneAndUpdate(
            {
              chain: network,
              type: payload.type,
              walletAddress: gasWallet.walletAddress,
            },
            {
              hashKey: await AwsUtils.encrypt(privateKey),
            },
            { new: true },
          );
          return wallet.walletAddress;
        }
        const wallet = await this.dataService.gasWalletModel.findOneAndUpdate(
          {
            chain: network,
            type: payload.type,
            walletAddress: gasWallet.walletAddress,
          },
          {
            walletAddress: account['address'],
            hashKey,
          },
          { new: true },
        );
        return wallet.walletAddress;
      }
    } catch (error) {
      throw error;
    }
  }

  async getGasWallet() {
    const web3Gateway = new Web3Gateway(+process.env.CHAIN_ID);
    const web3GatewayETH = new Web3Gateway(+process.env.CHAIN_ETH_ID);

    const wallet = await this.dataService.gasWalletModel.findMany({});

    const wallet1 = wallet.find((w) => w.walletType === WALLET_TYPE.IAO);
    const wallet2 = wallet.find((w) => w.walletType === WALLET_TYPE.DEX);

    console.log('wallet1', await AwsUtils.decrypt(wallet1.hashKey), 'wallet2', await AwsUtils.decrypt(wallet2.hashKey));

    const balance1BSC = await web3Gateway.getBalance(wallet1.walletAddress);
    const balance2BSC = await web3Gateway.getBalance(wallet2.walletAddress);

    const balance1ETH = await web3GatewayETH.getBalance(wallet1.walletAddress);
    const balance2ETH = await web3GatewayETH.getBalance(wallet2.walletAddress);

    return {
      wallet1: {
        balanceBSC: balance1BSC,
        balanceETH: balance1ETH,
        walletAddress: wallet1.walletAddress,
      },
      wallet2: {
        balanceBSC: balance2BSC,
        balanceETH: balance2ETH,
        walletAddress: wallet2.walletAddress,
      },
    };
  }
}
