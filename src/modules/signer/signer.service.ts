import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Web3Gateway } from 'src/blockchain/web3.gateway';
import { AwsUtils } from 'src/common/aws.util';
import { SetSignerDto } from './dto/signer.dto';
import { IDataServices } from 'src/core/abstracts/data-services.abstract';
import { ApiError } from 'src/common/api';
@Injectable()
export class SignerService {
  constructor(private readonly dataService: IDataServices) {}
  async createSigner(data: SetSignerDto) {
    try {
      if (data.secretKey !== process.env.SECRET_KEY_SIGNER) {
        throw ApiError('', 'Secret key is invalid');
      }
      const network = +process.env.CHAIN_ID;
      const signer = await this.dataService.signer.findOne({ chain: network });
      const web3Gateway = new Web3Gateway(+process.env.CHAIN_ID);
      const account = await web3Gateway.createAccount();
      const hashKey = await AwsUtils.encrypt(account['privateKey']);
      if (!signer) {
        return await this.dataService.signer.create({
          signer: account['address'],
          hashKey: hashKey,
          chain: network,
        });
      } else {
        await this.dataService.signer.updateOne(
          { chain: network },
          { signer: account['address'], hashKey },
        );
      }
    } catch (error) {
      throw error;
    }
  }
}
