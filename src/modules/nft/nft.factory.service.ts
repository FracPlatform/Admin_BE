import { Injectable } from '@nestjs/common';
import { CommonService } from 'src/common-service/common.service';
import { CacheKeyName, PREFIX_ID } from 'src/common/constants';
import { Utils } from 'src/common/utils';
import { IDataServices } from 'src/core/abstracts/data-services.abstract';
import { NFT_STATUS, NFT_TYPE } from 'src/datalayer/model/nft.model';
import { NftEntity } from 'src/entity/nft.entity';
import { CreateNftDto } from './dto/create-nft.dto';

@Injectable()
export class NftBuilderService {
  constructor(
    private readonly dataServices: IDataServices,
    private readonly commonService: CommonService,
  ) {}

  async createNft(body: CreateNftDto, user: any, session) {
    const tokenId = await Utils.getNextPrefixId(
      this.dataServices.counterId,
      PREFIX_ID.NFT,
      session,
    );
    let contractAddress;
    contractAddress = await this.commonService.getCache(
      CacheKeyName.NFT_ADDRESS.NAME,
    );
    if (!contractAddress) contractAddress = await Utils.getNftContractAddress();
    await this.commonService.setCache(
      CacheKeyName.NFT_ADDRESS.NAME,
      contractAddress,
    );
    const newNft: NftEntity = {
      nftType: body.nftType,
      assetId: body.assetId,
      tokenId,
      contractAddress,
      status: NFT_STATUS.DRAFT,
      display: body.display,
      chainId: body.chainId,
      mediaUrl: body.mediaUrl,
      previewUrl: body.previewUrl,
      metadata: body.metadata,
      unlockableContent: body.unlockableContent,
      name: body.name,
      description: body.description,
      createdBy: user.adminId,
      assetCategory: body.assetCategory,
      assetType: body.assetType,
    };
    return newNft;
  }
}
