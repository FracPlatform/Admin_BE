import { TokenStandard } from './common-type';
import 'dotenv/config';

export const ErrorCode = {
  DEFAULT_ERROR: 'E0',
  INVALID_ADDRESS_OR_SIGNDATA: 'E2',
  INVALID_EMAIL_OR_PASSWORD: 'E3',
  INVALID_VERIFICATION_CODE: 'E5',
  EXPIRED_VERIFICATION_CODE: 'E6',
  EMAIL_EXISTED: 'E7',
  FIELD_EXISTED: 'E9',
  INVALID_NEW_PASSWORD: 'E10',
  INVALID_DATA: 'E0',
  NO_DATA_EXISTS: 'E14',
  ALREADY_COMPLETED: 'already completed',
  MIN_PHOTOS: 'E14',
  INVALID_TOKENSYMBOL_OR_TOKENNAME: 'E11',
  MAX_FILE_SIZE: 'E12',
  INVALID_IAO_STATUS: 'E18',
  INVALID_ITEMS_STATUS: 'E19',
  INVALID_ITEMS_NFT_STATUS: 'E20',
  INVALID_ROLE_ADMIN: 'E15',
};
export const Contract = {
  EVENT: {
    TRANSFER_SINGLE: 'TransferSingle',
    TRANSFER_BATCH: 'TransferBatch',
    TRANSFER: 'Transfer',
  },
  ZERO_ADDRESS: '0x0000000000000000000000000000000000000000',
};
export const MIMEType = {
  APPLICATION_JSON: 'application/json',
  IMAGE_PNG: 'image/png',
  PDF: 'application/pdf',
  TEXT_PLAIN: 'text/plain',
};

export const QUEUE = {
  UPLOAD_IPFS: 'UPLOAD_IPFS',
  UPLOAD_IPFS_ASSET: 'UPLOAD_IPFS_ASSET',
};

export const QUEUE_SETTINGS = {
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
  delayedDebounce: 5000,
  removeOnSuccess: true,
  activateDelayedJobs: true,
};

export const MAX_RETRY = 3;

export const TIME_WAIT_RETRY = 300;

export const BlockChain = {
  Network: {
    BSC: [50, 51],
    ETH: [1, 3, 4, 5, 42, 11155111],
  },
};

export const CacheKeyName = {
  GET_CONFIG: {
    NAME: 'get-config',
    TTL: 300,
  },
  GET_FULL_CONFIG: {
    NAME: 'get-full-config',
    TTL: 300,
  },
  NFT_ADDRESS: {
    NAME: 'nft-address',
    TTL: 300,
  },
};

export const STRONG_PASSWORD_REGEX =
  /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,})/;

export const DEFAULT_OFFET = 0;

export const DEFAULT_LIMIT = 10;

export enum SORT_AGGREGATE {
  ASC = 1,
  DESC = -1,
}

export enum PREFIX_ID {
  FRACTOR = 'FRT',
  ADMIN = 'ADM',
  ASSET = 'AI',
  IAO_REQUEST = 'IR',
  ASSET_TYPE = 'AT',
  NFT = 'NFT',
  F_NFT = 'FNFT',
  IAO_EVENT = 'IE',
  ASSET_REDEMPTION_REQUEST = 'AR',
  USER = 'U',
  AFFILIATE = 'AFF',
  EXCHANGE_TOKEN = 'TKN',
  EXCHANGE_TRADING_PAIRS = 'TP',
  NOTIFICATION = 'NT',
  NFT_WITHDRAWAL_REQUEST = 'NWR',
  WITHDRAWAL_REQUEST = 'FWR',
  AFFILIATE_WITHDRAWAL_REQUEST = 'AWR',
  NONCE = 'NONCE',
}

export const CONTRACT_EVENTS = {
  SET_ADMIN: 'SetAdminEvent',
  MINT_NFT: 'MintNFTEvent',
  MINT_F_NFT: 'MintFNFTEvent',
  CREATE_IAO_EVENT_ON_CHAIN: 'CreateIAOEventEvent',
  DEACTIVE_F_NFT: 'DeactivateFNFTEvent',
  DEACTIVE_IAO_EVENT: 'DeactivateIAOEvent',
  DEPOSIT_NFTS: 'DepositNFTEvent',
  DEPOSIT_FUND_EVENT: 'DepositFundEvent',
  CLAIM_FNFT_SUCCESSFUL: 'WithdrawFNFTEvent',
  CLAIM_FNFT_FAILURE: 'WithdrawFundEvent',
  MERGE_FNFT: 'getNFTEvent',
  APPROVE_IAO_REVENUE_EVENT: 'SetFractorRevenueEvent',
  REJECT_IAO_REVENUE: 'ReturnFundEvent',
  RETURN_FUND_EVENT: 'FundReturnedEvent',
  FRACTOR_CLAIM_EVENT: 'FractorClaimEvent',
  REDEEM_NFT_EVENT: 'redeemNFTEvent',
  SENT_USER_FEE_SYSTEM: 'SentUserFeeSystem',
  CREATE_TIER_POOL_EVENT: 'CreateTierPool', // event in contract path1
  STAKE_EVENT: 'StakeTierPool', // event in contract path1
  UN_STAKE_EVENT: 'UnStakeTierPool', // event in contract path1
};

export enum CHAINID {
  POLYGON_MAINNET = 50,
  POLYGON_TESTNET = 51,
}

export enum CVS_NAME {
  WHITELIST = '[Frac]_IAOwhitelist_',
  IAO_EVENT = '[Frac]_IAOeventlist_',
  IAO_REVENUE = '[Frac]_IAOrevenuelist_',
  AFFILIATE_DASHBOARD = '[Frac]_AffiliateLineEarning_',
  AFFILIATE_EARNING = '[Frac]_AfffiliateBDearning_',
}

export const VAULT_TYPE_BY_ID = {
  1: 'Vault',
  2: 'Non-Vault',
};

export const CHAIN_NAME_BY_ID = {
  50: 'XDC',
  51: 'XDC',
};

export const ALLOCATION_TYPE_BY_ID = {
  1: 'FCFS',
};

export const ASSET_CATEGORY_BY_ID = {
  physical: 'Physical Asset',
  virtual: 'Digital Asset',
};

export const TOKEN_STANDARD_BY_ID = {
  0: TokenStandard.ERC_721,
  1: TokenStandard.ERC_1155,
};

export const REDEMPTION_REQUEST_TYPE = {
  APPROVE: 1,
  REJECT: 2,
};

export const DEFAULT_BD_COMMISSION_RATE = 5;

export const BASE_COINGECKO_URL = 'https://api.coingecko.com/api/v3';

export const INTERVAL_CRON_JOB = {
  UPDATE_IAO_REVENUE: 60000,
  SEND_WITHDRAWAL_TRANSACTION: 60000,
  SEND_NOTIFICATION: 60000,
};

export const SPOT_DEX_URL = {
  AFFILIATE_FEE: 'api/v1/admin/affiliate-fee',
  EXPORT_AFFILIATE_FEE: 'api/v1/admin/affiliate-fee/download',
  CHART_AFFILIATE_FEE: 'api/v1/admin/affiliate-fee/affiliate-chart',
  ADD_COINT: 'api/v1/coins/add-coin',
  BLOCK_USER: 'api/v1/admin/users/change-status-is-locked',
  BD_EARNING: 'api/v1/admin/affiliate-fee/statistic-bd',
  EXPORT_BD_EARNING: 'api/v1/admin/affiliate-fee/download-bd',
  LIST_PAIR: 'api/v1/pair/list',
};

export const MAX_BODY_LENGTH = 104857600;

export const SECONDS_IN_A_DAY = 86400;

export const enum BLOCK_STATUS {
  BLOCK = 0,
  UN_BLOCK = 1,
}

export enum WithdrawType {
  FRACTOR = 1,
  AFFILIATE = 2,
}

export enum LOCALIZATION {
  EN = 'en',
  CN = 'cn',
  JP = 'ja',
  VN = 'vi',
}

export enum TieringPoolStatus {
  ON = 1,
  OFF = 0,
}

export enum STAKING_TYPE {
  UNSTAKING = 2,
  STAKING = 1,
}

export const GAS_WALLET = {
  IAO_BSC: 'IAO_BSC',
  IAO_ETH: 'IAO_ETH',
  DEX: 'DEX',
};

export enum REDIS_KEY {
  TOKEN_ERC_20 = 'tokenERC20',
}

export enum REVIEW_WITHDRAWAL_TYPE {
  CANCEL = 0,
  APPROVE = 1,
}

export const JWT_SUBSCRIBE_EMAIL = { PRIVATE_KEY: 'jwt123@$' };

export enum PLATFORM_SITE {
  LANDING_PAGE = 1,
  FRACTOR = 2,
  TRADER = 3,
}

export const DURATION_INVALID_ACTION_WITHDRAWAL_REQUEST = 5;

export const SGD_ICON = 'https://www.xe.com/svgs/flags/sgd.static.svg';
export const MYR_ICON = 'https://www.xe.com/svgs/flags/myr.static.svg';
export const USD_ICON = 'https://www.xe.com/svgs/flags/usd.static.svg';
