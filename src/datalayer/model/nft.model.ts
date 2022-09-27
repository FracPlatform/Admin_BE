export enum NFT_TYPE {
  FRACTOR_ASSET = 1,
  FRAC_ASSET = 2,
}

export enum NFT_STATUS {
  DRAFT = 1,
  MINTED = 2,
  FRACTIONLIZED = 3,
  CLOSED = 4,
}

export class Nft {
  nftType: NFT_TYPE;
  assetId: string;
  assetCategory?: string;
  assetType?: string;
  tokenId: string;
  contractAddress: string;
  fNftId: string;
  status: NFT_STATUS;
  display: boolean;
  chainId: number;
  mediaUrl: string;
  previewUrl: string;
}
