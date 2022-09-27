export const ErrorCode = {
  DEFAULT_ERROR: 'E0',
  INVALID_ADDRESS_OR_SIGNDATA: 'E2',
  INVALID_EMAIL_OR_PASSWORD: 'E3',
  INVALID_VERIFICATION_CODE: 'E5',
  EXPIRED_VERIFICATION_CODE: 'E6',
  EMAIL_EXISTED: 'E7',
  INVALID_NEW_PASSWORD: 'E10',
  INVALID_DATA: 'E15',
  NO_DATA_EXISTS: 'E14',
  ALREADY_COMPLETED: 'already completed',
  MIN_PHOTOS: 'E14',
  MAX_FILE_SIZE: 'E12',
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
};

export const QUEUE = {
  UPLOAD_IPFS: 'UPLOAD_IPFS',
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
    BSC: [56, 97],
    ETH: [1, 3, 4, 5, 42],
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
};

export const STRONG_PASSWORD_REGEX =
  /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,})/;

export const DEFAULT_OFFET = 0;

export const DEFAULT_LIMIT = 10;

export enum PREFIX_ID {
  FRACTOR = 'F',
  ADMIN = 'A',
  ASSET = 'ITEM',
  IAO_REQUEST = 'IAO-REQUEST',
  ASSET_TYPE = 'ATYPE',
  F_NFT = 'FNFT',
}

export const CONTRACT_EVENTS = {
  SET_ADMIN: 'SetAdminEvent',
};
