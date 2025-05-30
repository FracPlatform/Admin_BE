import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { CommonService } from 'src/common-service/common.service';
import { CacheKeyName, PREFIX_ID } from 'src/common/constants';
import { Utils } from 'src/common/utils';
import { IDataServices } from 'src/core/abstracts/data-services.abstract';
import { FNFT_DECIMAL } from 'src/datalayer/model';
import { NFT_STATUS } from 'src/datalayer/model/nft.model';
import {
  NftDetailEntity,
  NftEntity,
  NftMetadataEntity,
} from 'src/entity/nft.entity';
import { S3Service } from 'src/s3/s3.service';
import { CreateNftDto } from './dto/create-nft.dto';
import { EditNftDto } from './dto/edit-nft.dto';
const FileType = require('file-type/browser');

@Injectable()
export class NftBuilderService {
  constructor(
    private readonly dataServices: IDataServices,
    private readonly commonService: CommonService,
    private readonly s3Service: S3Service,
  ) {}

  async createNft(body: CreateNftDto, user: any, session, assetItem) {
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
      tokenId.split('-')[1],
    );
    const newNft: NftEntity = {
      nftType: body.nftType,
      assetId: body.assetId || null,
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
      deleted: false,
      metadataUrl,
      collectionId: assetItem?.collectionId,
      assetUuid: assetItem?._id,
      inIaoEventOnChain: false,
    };
    return newNft;
  }

  async createNftMetadata(body: CreateNftDto) {
    const nftMetadata: NftMetadataEntity = {
      name: body.name,
      description: body.description,
      image: body.previewUrl ? body.previewUrl : body.mediaUrl,
      animation_url: body.previewUrl ? body.mediaUrl : '',
      animation_type: '',
      external_url: '',
      attributes: [...body.metadata],
    };
    if (body.previewUrl) {
      const response = await axios.get(body.mediaUrl, {
        responseType: 'stream',
      });
      const { fileType } = await FileType.stream(response.data);
      nftMetadata.animation_type = fileType.ext;
    }
    return nftMetadata;
  }

  async convertNFTDetail(data: any, iaoRequest: any) {
    const nftDetail: NftDetailEntity = {
      tokenId: data.tokenId,
      nftType: data.nftType,
      assetId: data.assetId,
      assetCategory: data.assetCategory,
      assetType: data.assetType,
      status: data.status,
      display: data.display,
      chainId: data.chainId,
      contractAddress: data.contractAddress,
      mediaUrl: data.mediaUrl,
      previewUrl: data.previewUrl,
      name: data.name,
      description: data.description,
      metadata: data.metadata,
      unlockableContent: data.unlockableContent,
      iaoEvent: {
        iaoEventId: iaoRequest?.iaoEventId,
      },
      fnft: {
        id: data.fnft?.fnftId,
        tokenSymbol: data.fnft?.tokenSymbol,
        totalSupply: data.fnft?.totalSupply,
        contractAddress: data.fnft?.contractAddress,
        decimals: FNFT_DECIMAL,
      },
      asset: {
        status: data.asset?.status,
        isMintNFT: data.asset?.isMintNFT,
        createdBy: {
          id: data.fractor?.fractorId,
          name: data.fractor?.fullname,
        },
        iaoRequestId: iaoRequest?.iaoId,
      },
      createdBy: {
        id: data.createdByAdmin?.adminId,
        name: data.createdByAdmin?.fullname,
      },
      createdAt: data.createdAt,
      mintedBy: {
        id: data.mintedByAdmin?.adminId,
        name: data.mintedByAdmin?.fullname,
      },
      mintedAt: data.mintedAt,
      mintingHashTx: data.mintingHashTx,
      fractionalizedBy: {
        id: data.fractionalizedByAdmin?.adminId,
        name: data.fractionalizedByAdmin?.fullname,
      },
      fractionalizationTxHash: data.fnft?.txhash,
      fractionalizedAt: data.fnft?.fractionalizedOn,
    };
    if (nftDetail.previewUrl) {
      const response = await axios.get(nftDetail.mediaUrl, {
        responseType: 'stream',
      });
      const { fileType } = await FileType.stream(response.data);
      nftDetail.mediaType = fileType.ext;
    }
    return nftDetail;
  }

  async updateNftMetadata(updatedData: EditNftDto, currentNft: NftEntity) {
    const { data } = await axios.get(currentNft.metadataUrl);
    const nftMetadata: NftMetadataEntity = { ...data };
    if (updatedData.mediaUrl) {
      nftMetadata.image = updatedData.mediaUrl;
      nftMetadata.animation_type = '';
      nftMetadata.animation_url = '';
    }
    if (updatedData.previewUrl) {
      const response = await axios.get(updatedData.mediaUrl, {
        responseType: 'stream',
      });
      const { fileType } = await FileType.stream(response.data);
      nftMetadata.animation_type = fileType.ext;
      nftMetadata.animation_url = updatedData.mediaUrl;
      nftMetadata.image = updatedData.previewUrl;
    }
    if (updatedData.description)
      nftMetadata.description = updatedData.description;
    if (updatedData.name) nftMetadata.name = updatedData.name;
    if (updatedData.metadata) nftMetadata.attributes = updatedData.metadata;
    return nftMetadata;
  }
}
