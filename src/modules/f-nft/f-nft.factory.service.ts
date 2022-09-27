import { Injectable } from '@nestjs/common';
import { Utils } from 'src/common/utils';
import { IDataServices } from 'src/core/abstracts/data-services.abstract';
import { PREFIX_ID } from 'src/common/constants';
import { FnftEntity, ListFnftEntity } from 'src/entity';
import { CreateFnftDto } from './dto/f-nft.dto';
import { F_NFT_STATUS } from 'src/datalayer/model';

@Injectable()
export class FnftBuilderService {
  constructor(private readonly dataServices: IDataServices) { }

  async createFnft(
    data: CreateFnftDto,
    user: any,
    session,
  ): Promise<FnftEntity> {
    const fnft: FnftEntity = {
      tokenSymbol: data.tokenSymbol,
      tokenName: data.tokenName,
      totalSupply: data.totalSupply,
      tokenLogo: data.tokenLogo,
      chainId: 20,
      txhash: null,
      contractAddress: null,
      status: F_NFT_STATUS.INACTIVE,
      iaoRequestId: data.iaoRequestId || null,
      items: data.items,
      fractionalizedBy: user.adminId,
      fractionalizedOn: null,
      lastUpdateBy: null,
      fnftId: await Utils.getNextPrefixId(
        this.dataServices.counterId,
        PREFIX_ID.F_NFT,
        session,
      ),
      deleted: false,
    };
    return fnft;
  }

  convertFnfts(data) {
    return data.map((e) => {
      const fnft: ListFnftEntity = {
        _id: e._id,
        tokenSymbol: e.tokenSymbol,
        items: e.items,
        contractAddress: e.contractAddress,
        totalSupply: e.totalSupply,
        status: e.status,
        fractionalizedBy: e.fractionalizedBy,
        fractionalizedOn: e.fractionalizedOn,
        fnftId: e.fnftId,
      };
      return fnft;
    });
  }
}
