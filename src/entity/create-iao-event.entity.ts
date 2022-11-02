import {
  EventName,
  IAO_EVENT_STAGE,
  Revenue,
  REVENUE_STATUS,
  VAULT_TYPE,
} from 'src/datalayer/model';

export class CreateIAOEventEntity {
  iaoEventId: string;
  isDisplay: boolean;
  chainId: number;
  FNFTcontractAddress: string;
  iaoRequestId: string;
  registrationStartTime: Date;
  registrationEndTime: Date;
  iaoEventDuration: number;
  participationStartTime: Date;
  participationEndTime: any;
  vaultType: number;
  acceptedCurrencyAddress: string;
  acceptedCurrencySymbol: string;
  exchangeRate: number;
  percentageOffered: number;
  vaultUnlockThreshold: number;
  eventPhotoUrl: string;
  eventBannerUrl: string;
  iaoEventName: EventName;
  description: EventName;
  allocationType: number;
  hardCapPerUser: number;
  whitelistRegistrationUrl: string;
  whitelistAnnouncementTime: Date;
  onChainStatus: number;
  updatedBy: string;
  createdBy: string;
  totalSupply: number;
  availableSupply: number;
  tokenSymbol: string;
  currencyDecimal: number;
  revenue: Revenue;
}

export class IAOEventDetailEntity {
  iaoEventId: string;
  status: number;
  onChainStatus: number;
  currentStage: number;
  isDisplay: boolean;
  chainId: number;
  FNFTcontractAddress: string;
  tokenSymbol: string;
  tokenName: string;
  tokenLogo: string;
  fnftStatus: number;
  fnftDecimal: number;
  iaoRequestStatus: number;
  iaoRequestType: number;
  fractor: string;
  bd: string;
  iaoRequestDuration: number;
  iaoRequestOffer: number;
  iaoRequestVaultUnlockThreshold: number;
  totalItems: number;
  items: [];
  nfts: [];
  registrationStartTime: Date;
  registrationEndTime: Date;
  iaoEventDuration: number;
  participationStartTime: Date;
  participationEndTime: Date;
  iaoEventVaultType: number;
  acceptedCurrencyAddress: string;
  exchangeRate: number;
  percentageOffered: number;
  vaultUnlockThreshold: number;
  eventPhotoUrl: string;
  eventBannerUrl: string;
  iaoEventName: EventName;
  description: EventName;
  allocationType: number;
  hardCapPerUser: number;
  whitelistRegistrationUrl: string;
  whitelistAnnouncementTime: Date;
  whitelist: [];
  totalWhitelist: number;
  updatedBy: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  createdOnChainBy: string;
  createdOnChainAt: Date;
  lastWhitelistUpdatedAt: Date;
  lastWhitelistUpdatedBy: string;
}

export class ExportedIAOEventEntity {
  iaoEventId: string;
  iaoEventDuration: string;
  registrationStartTime: string;
  registrationEndTime: string;
  participationStartTime: string;
  participationEndTime: string;
  iaoEventName: string;
  vaultType: string;
  chainId: string;
  FNFTcontractAddress: string;
  tokenSymbol: string;
  totalSupply: number;
  fNftDecimals: number;
  iaoRequestId: string;
  acceptedCurrencyAddress: string;
  acceptedCurrencySymbol: string;
  exchangeRate: number;
  assetValuation: number;
  IAOOffered: number;
  IAOOfferedToken: number;
  vaultUnlockThreshold: number;
  vaultUnlockThresholdToken: number;
  display: boolean;
  numberOfItems: number;
  assetName: string;
  assetCategory: string;
  assetType: string;
  allocationType: string;
  hardCapPerUser: number;
  hardCapPerUserToken: number;
  whitelistAnnouncementTime: string;
  createdBy: string;
  createdOn: string;
  createdOnChainBy: string;
  createdOnChainOn: string;
  updatedBy: string;
  updatedOn: string;
  lastWhitelistUpdatedBy: string;
  lastWhitelistUpdatedOn: string;
}

export class IaoRevenueEntity {
  iaoEventName: EventName;
  iaoEventId: string;
  registrationStartTime: Date;
  registrationEndTime: Date;
  participationStartTime: Date;
  participationEndTime: Date;
  revenue: Revenue;
  soldAmount: number;
  participatedAmount: number;
  progress: number;
  participants: number;
  vaultUnlockThreshold: number;
  acceptedCurrencySymbol: string;
  tokenSymbol: string;
  eventPhotoUrl: string;
  eventBannerUrl: string;
  stage: IAO_EVENT_STAGE;
  vaultType: VAULT_TYPE;
}

export class IaoRevenueDetaiLEntity extends IaoRevenueEntity {
  platformGrossCommission: number;
  fractorNetRevenue: number;
  bdCommission: number;
  platformNetCommission: number;
  assignBD: object;
  fractor: object;
}

export class ExportedIaoRevenueEntity {
  iaoEventId: string;
  participationStartTime: string;
  participationEndTime: string;
  iaoEventName: EventName;
  vaultType: string;
  stage: string;
  revenueStatus: string;
  acceptedCurrencySymbol: string;
  participatedAmount: number;
  grossRevenue: number;
  platformComissionRate: string;
  platformGrossCommission: number;
  fractorNetRevenue: number;
  bdCommission: number;
  assignBD: string;
  fractor: string;
  finalizedOn: string;
  finalizedBy: string;
}
