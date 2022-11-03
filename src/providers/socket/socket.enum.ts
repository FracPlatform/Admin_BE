export enum SOCKET_ROOM {
  USER = 'user',
  ADMIN = 'admin',
}

export enum SOCKET_EVENT {
  ACTIVE_ADMIN_EVENT = 'active-admin-event',
  DEACTIVE_ADMIN_EVENT = 'deactive-admin-event',
  MINT_NFT_EVENT = 'mint-nft-event',
  MINT_F_NFT_EVENT = 'mint-f-nft-event',
  CREATE_IAO_EVENT_ON_CHAIN = 'create-iao-event-on-chain',
  DEACTIVE_F_NFT = 'deactive-f-nft',
  DEACTIVE_IAO_EVENT = 'deactive-iao-event',
  DEPOSIT_NFTS = 'deposit-nfts',
  DEPOSIT_FUND_EVENT = 'deposit-funds-event',
  CLAIM_FNFT_SUCCESSFUL_EVENT = 'claim-fnft-successful-event',
  CLAIM_FNFT_FAILURE_EVENT = 'claim-fnft-failure-event',
  MERGE_FNFT_EVENT = 'merge-fnft-event',
  APPROVE_IAO_REVENUE = 'approve-iao-revenue',
}
