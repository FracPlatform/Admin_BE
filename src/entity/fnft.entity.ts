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
  fractionalizedBy: string;
  fractionalizedOn: Date;
  lastUpdateBy: string;
  fnftId?: string;
  deleted: boolean;
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
}
