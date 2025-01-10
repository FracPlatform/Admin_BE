import { CategoryType, Trait } from 'src/datalayer/model';
import { NFT_STATUS, NFT_TYPE } from 'src/datalayer/model/nft.model';

export class NftEntity {
  nftType: NFT_TYPE;
  assetId?: string;
  assetCategory?: CategoryType;
  assetType?: string;
  tokenId: string;
  contractAddress: string;
  status: NFT_STATUS;
  display: boolean;
  chainId: number;
  mediaUrl: string;
  previewUrl: string;
  metadata: Trait[];
  unlockableContent?: string;
  name: string;
  description: string;
  metadataUrl: string;
  createdBy: string;
  deleted: boolean;
  collectionId: string;
  assetUuid: string;
  inIaoEventOnChain?: boolean;
}

export class NftMetadataEntity {
  name?: string;
  description?: string;
  image?: string;
  animation_url?: string;
  animation_type?: string;
  external_url?: string;
  asset_url?: string;
  attributes?: object[];
}

export class NftDetailEntity {
  nftType: NFT_TYPE;
  assetId?: string;
  assetCategory?: CategoryType;
  assetType?: string;
  tokenId: string;
  contractAddress: string;
  status: NFT_STATUS;
  display: boolean;
  chainId: number;
  mediaUrl: string;
  previewUrl: string;
  metadata: Trait[];
  unlockableContent?: string;
  name: string;
  description: string;
  createdBy: object;
  createdAt: string;
  mintedBy: object;
  mintedAt: string;
  mintingHashTx: string;
  fractionalizedBy: object;
  fractionalizedAt: string;
  fractionalizationTxHash: string;
  fnft: object;
  asset: object;
  mediaType?: string;
  iaoEvent?: object;
}
