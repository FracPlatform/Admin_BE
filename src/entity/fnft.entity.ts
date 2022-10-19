export class FnftEntity {
  tokenSymbol: string;
  tokenName: string;
  totalSupply: number;
  tokenLogo: string;
  chainId: number;
  txhash: string;
  contractAddress: string;
  items: any;
  fnftType: number;
  iaoRequestId: string;
  status: number;
  mintedStatus: number;
  fractionalizedBy: string;
  fractionalizedOn: Date;
  lastUpdateBy: string;
  fnftId?: string;
  deleted: boolean;
  availableSupply: number;
}

export class ListFnftEntity {
  _id: string;
  tokenSymbol: string;
  items: any;
  contractAddress: string;
  totalSupply: number;
  status: number;
  fractionalizedBy: string;
  fractionalizedOn: Date;
  fnftId?: string;
  sizeOfItem?: string;
  createdAt?: Date;
}

export class FnftDetailEntity {
  _id: string;
  tokenSymbol: string;
  tokenName: string;
  totalSupply: number;
  tokenLogo: string;
  chainId: number;
  contractAddress: number;
  items: any;
  iaoRequestId: string;
  fnftType: number;
  txhash: string;
  status: number;
  mintedStatus: number;
  adminFractionalized: object;
  adminUpdated: object;
  fnftId?: string;
  deleted?: boolean;
  fractionalizedOn?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
