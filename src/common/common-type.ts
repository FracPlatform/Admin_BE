export interface PagingDocument {
  docs?: any[];
  totalDocs?: number;
  limit?: number;
  page?: number;
  pagingCounter?: number;
  hasPrevPage?: boolean;
  hasNextPage?: boolean;
  prevPage?: string;
  nextPage?: string;
  [key: string]: any;
}

export interface ListDocument {
  docs?: any[];
  metadata?: object;
  totalDocs?: number;
}

export enum TokenStandard {
  ERC_721 = 'erc-721',
  ERC_1155 = 'erc-1155',
}
