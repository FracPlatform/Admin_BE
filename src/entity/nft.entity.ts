import { CategoryType } from 'src/datalayer/model';
import {
  NftMetadata,
  NFT_STATUS,
  NFT_TYPE,
} from 'src/datalayer/model/nft.model';

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
  metadata: NftMetadata;
  unlockableContent?: string;
  name: string;
  description: string;
  createdBy: string;
}
