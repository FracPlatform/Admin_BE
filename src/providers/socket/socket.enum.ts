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
  REJECT_IAO_REVENUE = 'reject-iao-revenue',
  STAKE_EVENT = 'stake-pool-event', // event in contract path1
  UN_STAKE_EVENT = 'unstake-pool-event', // event in contract path1
  TRADER_WITHDRAWL = 'trader-withdrawl',
}

export enum SOCKET_NOTIFICATION_EVENT {
  WHITELIST_ANNOUNCEMENT_EVENT = 'whitelist-announcement-event',
  PARTICIPATION_TIME_START_EVENT = 'participation-time-start-event',
  IAO_EVENT_SUCCEEDED_EVENT = 'iao-event-succeeded-event',
  IAO_EVENT_FAILED_EVENT = 'iao-event-failed-event',
  REJECT_IAO_REVENUE_EVENT = 'reject-iao-revenue-event',
  FRACTORS_ANNOUNCEMENT_EVENT = 'fractors-announcement-event',
  TRADERS_ANNOUNCEMENT_EVENT = 'traders-announcement-event',
  ADMIN_APPROVED_IAO_REQUEST = 'admin-approved-iao-request',
  ADMIN_REJECT_IAO_REQUEST = 'admin-reject-iao-request',
  ADMIN_CREATE_IAO_EVENT = 'admin-create-iao-event',
  FRACTOR_IAO_EVENT_SUCCEEDED_EVENT = 'fractor-iao-event-succeeded-event',
  FRACTOR_IAO_EVENT_NON_VAULT_SUCCEEDED_EVENT = 'fractor-iao-event-non-vault-succeeded-event',
  FRACTOR_IAO_EVENT_FAILED_EVENT = 'fractor-iao-event-failed-event',
  CHANGE_STATUS_REDEMPTION_REQUEST_EVENT = 'change-status-redemption-request-event',
  ADMIN_APPROVED_IAO_REVENUE_EVENT = 'admin-approved-iao-revenue-event',
  ADMIN_REJECT_IAO_REVENUE_EVENT = 'admin-reject-iao-revenue-event',
  FRACTOR_WITHDRAWAL_REQUEST_SUCCESSFULLY = 'fractor-withdrawal-request-successfully',
  PARTICIPATION_END_TIME_EVENT = 'participation-end-time-event',
  FNFT_MERGED_EVENT = 'fnft-merged-event',
  CANCEL_WITHDRAWAL = 'cancel-withdrawal',
}

export enum SOCKET_NAMESPACE {
  WORKER = '/admin-socket.io',
  ANNOUNCEMENT = '/announcement',
  ADMIN_ANNOUNCEMENT = '/admin-announcement',
  IAO_REQUEST_REVIEW_RESULT = '/iao-request-review-result',
  IAO_EVENT_RESULT = '/iao-event-result',
  REVENUE_WITHDRAWAL = '/revenue-withdrawal',
  TRADER_ASSET_REDEMPTION_REQUEST_REVIEW_RESULT = '/trader-asset-redemption-request-review-result',
  WHITELIST_ANNOUNCEMENT = '/whitelist-announcement',
  IAO_EVENT_SCHEDULE = '/iao-event-schedule',
  FRACTOR_ASSET_REDEMPTION_REQUEST_REVIEW_RESULT = '/fractor-asset-redemption-request-review-result',
  AFFILIATE_OFFERS = '/affiliate-offers',
}
