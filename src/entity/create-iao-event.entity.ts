import { EventName } from 'src/datalayer/model';

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
}
