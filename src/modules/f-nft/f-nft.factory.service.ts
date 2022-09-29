import { Injectable } from '@nestjs/common';
import { Utils } from 'src/common/utils';
import { IDataServices } from 'src/core/abstracts/data-services.abstract';
import { PREFIX_ID } from 'src/common/constants';
import { FnftDetailEntity, FnftEntity, ListFnftEntity } from 'src/entity';
import { CreateFnftDto, UpdateFnftDto } from './dto/f-nft.dto';
import {
  F_NFT_MINTED_STATUS,
  F_NFT_STATUS,
  F_NFT_TYPE,
} from 'src/datalayer/model';

@Injectable()
export class FnftBuilderService {
  constructor(private readonly dataServices: IDataServices) {}

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
      chainId: data.chainId,
      txhash: null,
      contractAddress: null,
      status: F_NFT_STATUS.ACTIVE,
      mintedStatus: F_NFT_MINTED_STATUS.PROCESS,
      iaoRequestId: data.iaoRequestId || null,
      items: data.items,
      fnftType: data.iaoRequestId
        ? F_NFT_TYPE.AUTO_IMPORT
        : F_NFT_TYPE.SELECT_MANUALY,
      fractionalizedBy: user.adminId,
      fractionalizedOn: null,
      lastUpdateBy: user.adminId,
      fnftId: await Utils.getNextPrefixId(
        this.dataServices.counterId,
        PREFIX_ID.F_NFT,
        session,
      ),
      deleted: false,
    };
    return fnft;
  }

  updateFnft(data: UpdateFnftDto, currentAdminId) {
    const dataUpdate = {
      tokenName: data.tokenName,
      tokenLogo: data.tokenLogo,
      lastUpdateBy: currentAdminId,
    };
    return dataUpdate;
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

  convertFnftDetail(data, currentassetIds: string[], listNft: any, relatedAdminList: any) {
    const items = [];

    for (const i of currentassetIds) {
      items.push(listNft.find((a) => a.assetId == i));
    }

    const fnft: FnftDetailEntity = {
      _id: data._id,
      tokenSymbol: data.tokenSymbol,
      tokenName: data.tokenName,
      totalSupply: data.totalSupply,
      tokenLogo: data.tokenLogo,
      chainId: data.chainId,
      contractAddress: data.contractAddress,
      items,
      iaoRequestId: data.iaoRequestId,
      fnftType: data.fnftType,
      txhash: data.txhash,
      status: data.status,
      mintedStatus: data.mintedStatus,
      adminFractionalized: relatedAdminList.find(
        (adminInfo) => adminInfo.adminId == data.fractionalizedBy,
      ),
      adminUpdated: relatedAdminList.find(
        (adminInfo) => adminInfo.adminId == data.lastUpdateBy,
      ),
      fnftId: data.fnftId,
      deleted: data.deleted,
      fractionalizedOn: data.fractionalizedOn,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
    return fnft;
  }
}
