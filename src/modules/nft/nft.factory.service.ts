import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { CommonService } from 'src/common-service/common.service';
import { CacheKeyName, PREFIX_ID } from 'src/common/constants';
import { Utils } from 'src/common/utils';
import { IDataServices } from 'src/core/abstracts/data-services.abstract';
import { NFT_STATUS } from 'src/datalayer/model/nft.model';
import { NftEntity, NftMetadataEntity } from 'src/entity/nft.entity';
import { S3Service } from 'src/s3/s3.service';
import { CreateNftDto } from './dto/create-nft.dto';
const FileType = require('file-type/browser');

@Injectable()
export class NftBuilderService {
  constructor(
    private readonly dataServices: IDataServices,
    private readonly commonService: CommonService,
    private readonly s3Service: S3Service,
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
    if (!contractAddress) {
      contractAddress = await Utils.getNftContractAddress();
      await this.commonService.setCache(
        CacheKeyName.NFT_ADDRESS.NAME,
        contractAddress,
      );
    }
    const nftMetadata = await this.createNftMetadata(body);
    const metadataUrl = await this.s3Service.uploadNftMetadata(
      nftMetadata,
      tokenId,
    );
    const newNft: NftEntity = {
      nftType: body.nftType,
      assetId: body.assetId,
      assetCategory: body.assetCategory,
      assetType: body.assetType,
      tokenId,
      contractAddress,
      mediaUrl: body.mediaUrl,
      status: NFT_STATUS.DRAFT,
      display: body.display,
      chainId: body.chainId,
      previewUrl: body.previewUrl,
      metadata: body.metadata,
      unlockableContent: body.unlockableContent,
      name: body.name,
      description: body.description,
      createdBy: user.adminId,
      metadataUrl,
    };
    return newNft;
  }

  async createNftMetadata(body: CreateNftDto) {
    const response = await axios.get(body.mediaUrl, { responseType: 'stream' });
    const { fileType } = await FileType.stream(response.data);
    const nftMetadata: NftMetadataEntity = {
      name: body.name,
      description: body.description,
      image: body.mediaUrl ? body.previewUrl : body.mediaUrl,
      animation_url: body.mediaUrl,
      animation_type: fileType.ext,
      external_url: '',
      attributes: [...body.metadata],
    };
    return nftMetadata;
  }
}
