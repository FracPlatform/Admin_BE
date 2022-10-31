import { Injectable } from '@nestjs/common';
import {
  ALLOCATION_TYPE_BY_ID,
  ASSET_CATEGORY_BY_ID,
  CHAIN_NAME_BY_ID,
  PREFIX_ID,
  VAULT_TYPE_BY_ID,
} from 'src/common/constants';
import { Utils } from 'src/common/utils';
import { IDataServices } from 'src/core/abstracts/data-services.abstract';
import {
  CategoryType,
  FNFT_DECIMAL,
  IAO_EVENT_CALENDER,
  ON_CHAIN_STATUS,
  REVENUE_STATUS,
} from 'src/datalayer/model';
import {
  CreateIAOEventEntity,
  ExportedIAOEventEntity,
} from 'src/entity/create-iao-event.entity';
import { CreateIaoEventDto } from './dto/create-iao-event.dto';
import { UpdateIaoEventDto } from './dto/update-iao-event.dto';

@Injectable()
export class IaoEventBuilderService {
  constructor(private readonly dataServices: IDataServices) {}

  async createIAOEvent(
    createIaoEventDto: CreateIaoEventDto,
    user: any,
    session,
  ): Promise<CreateIAOEventEntity> {
    return {
      iaoEventId: await Utils.getNextPrefixId(
        this.dataServices.counterId,
        PREFIX_ID.IAO_EVENT,
        session,
      ),
      isDisplay: createIaoEventDto.isDisplay,
      chainId: createIaoEventDto.chainId,
      FNFTcontractAddress: createIaoEventDto.FNFTcontractAddress,
      iaoRequestId: createIaoEventDto['iaoRequestId'],
      registrationStartTime: createIaoEventDto.registrationStartTime,
      registrationEndTime: createIaoEventDto.registrationEndTime,
      iaoEventDuration: createIaoEventDto.iaoEventDuration,
      participationStartTime: createIaoEventDto.participationStartTime,
      participationEndTime: createIaoEventDto['participationEndTime'],
      vaultType: createIaoEventDto.vaultType,
      acceptedCurrencyAddress: createIaoEventDto.acceptedCurrencyAddress,
      acceptedCurrencySymbol: createIaoEventDto['currencySymbol'],
      currencyDecimal: createIaoEventDto['currencyDecimal'],
      exchangeRate: createIaoEventDto.exchangeRate,
      percentageOffered: createIaoEventDto.percentageOffered,
      vaultUnlockThreshold: createIaoEventDto.vaultUnlockThreshold,
      eventPhotoUrl: createIaoEventDto.eventPhotoUrl,
      eventBannerUrl: createIaoEventDto.eventBannerUrl,
      iaoEventName: createIaoEventDto.iaoEventName,
      description: createIaoEventDto.description,
      allocationType: createIaoEventDto.allocationType,
      hardCapPerUser: createIaoEventDto.hardCapPerUser,
      whitelistRegistrationUrl: createIaoEventDto.whitelistRegistrationUrl,
      whitelistAnnouncementTime: createIaoEventDto.whitelistAnnouncementTime,
      onChainStatus: ON_CHAIN_STATUS.DRAFT,
      updatedBy: user.adminId,
      createdBy: user.adminId,
      totalSupply: createIaoEventDto['totalSupply'],
      availableSupply: createIaoEventDto['availableSupply'],
      tokenSymbol: createIaoEventDto['tokenSymbol'],
      revenueStatus: REVENUE_STATUS.PENDING,
    };
  }

  getIaoEventDetail(iaoEvent: any, fnft: any, iaoRequest: any, obj: any) {
    return {
      iaoEventId: iaoEvent.iaoEventId,
      status: iaoEvent.status,
      onChainStatus: iaoEvent.onChainStatus,
      currentStage: iaoEvent['currentStage'],
      isDisplay: iaoEvent.isDisplay,
      chainId: iaoEvent.chainId,
      FNFTcontractAddress: iaoEvent.FNFTcontractAddress,
      tokenSymbol: fnft.tokenSymbol,
      tokenName: fnft.tokenName,
      tokenLogo: fnft.tokenLogo,
      fnftStatus: fnft.status,
      fnftDecimal: FNFT_DECIMAL,
      iaoRequestStatus: iaoRequest?.status,
      iaoRequestType: iaoRequest?.type,
      fractor: iaoRequest?.fractor,
      bd: iaoRequest?.bd,
      iaoRequestDuration: iaoRequest?.eventDuration,
      iaoRequestOffer: iaoRequest?.percentOffered,
      iaoRequestVaultUnlockThreshold: iaoRequest?.percentVault,
      totalItems: iaoRequest?.items.length,
      items: iaoRequest?.itemObject,
      nfts: fnft.items,
      registrationStartTime: iaoEvent.registrationStartTime,
      registrationEndTime: iaoEvent.registrationEndTime,
      iaoEventDuration: iaoEvent.iaoEventDuration,
      participationStartTime: iaoEvent.participationStartTime,
      participationEndTime: iaoEvent.participationEndTime,
      iaoEventVaultType: iaoEvent.vaultType,
      acceptedCurrencyAddress: iaoEvent.acceptedCurrencyAddress,
      exchangeRate: iaoEvent.exchangeRate,
      percentageOffered: iaoEvent.percentageOffered,
      vaultUnlockThreshold: iaoEvent.vaultUnlockThreshold,
      eventPhotoUrl: iaoEvent.eventPhotoUrl,
      eventBannerUrl: iaoEvent.eventBannerUrl,
      iaoEventName: iaoEvent.iaoEventName,
      description: iaoEvent.description,
      allocationType: iaoEvent.allocationType,
      hardCapPerUser: iaoEvent.hardCapPerUser,
      whitelistRegistrationUrl: iaoEvent.whitelistRegistrationUrl,
      whitelistAnnouncementTime: iaoEvent.whitelistAnnouncementTime,
      whitelist: iaoEvent.whitelist,
      totalWhitelist: iaoEvent.whitelist.length,
      updatedBy: { id: iaoEvent.updatedBy, name: obj.updatedBy?.fullname },
      createdBy: { id: iaoEvent.createdBy, name: obj.createdBy?.fullname },
      createdAt: iaoEvent.createdAt,
      updatedAt: iaoEvent.updatedAt,
      createdOnChainBy: {
        id: iaoEvent.createdOnChainBy,
        name: obj.createdOnChainBy?.fullname,
      },
      createdOnChainAt: iaoEvent.createdOnChainAt,
      lastWhitelistUpdatedAt: iaoEvent.lastWhitelistUpdatedAt,
      lastWhitelistUpdatedBy: {
        id: iaoEvent.lastWhitelistUpdatedBy,
        name: obj.lastWhitelistUpdatedBy?.fullname,
      },
    };
  }

  updateIaoEventDetail(iaoEvent: UpdateIaoEventDto, user: any) {
    return {
      isDisplay: iaoEvent.isDisplay,
      FNFTcontractAddress: iaoEvent.FNFTcontractAddress,
      registrationStartTime: iaoEvent.registrationStartTime,
      registrationEndTime: iaoEvent.registrationEndTime,
      iaoEventDuration: iaoEvent.iaoEventDuration,
      participationStartTime: iaoEvent.participationStartTime,
      participationEndTime: iaoEvent.participationEndTime,
      vaultType: iaoEvent.vaultType,
      acceptedCurrencyAddress: iaoEvent.acceptedCurrencyAddress,
      exchangeRate: iaoEvent.exchangeRate,
      percentageOffered: iaoEvent.percentageOffered,
      vaultUnlockThreshold: iaoEvent.vaultUnlockThreshold,
      eventPhotoUrl: iaoEvent.eventPhotoUrl,
      eventBannerUrl: iaoEvent.eventBannerUrl,
      iaoEventName: iaoEvent.iaoEventName,
      description: iaoEvent.description,
      allocationType: iaoEvent.allocationType,
      hardCapPerUser: iaoEvent.hardCapPerUser,
      whitelistRegistrationUrl: iaoEvent.whitelistRegistrationUrl,
      whitelistAnnouncementTime: iaoEvent.whitelistAnnouncementTime,
      updatedBy: user.adminId,
      updatedAt: new Date(),
      acceptedCurrencySymbol: iaoEvent['currencySymbol'],
      currencyDecimal: iaoEvent['currencyDecimal'],
      totalSupply: iaoEvent['totalSupply'],
      availableSupply: iaoEvent['availableSupply'],
      tokenSymbol: iaoEvent['tokenSymbol'],
      iaoRequestId: iaoEvent['iaoRequestId'],
    };
  }

  updateIaoOnChain(iaoEvent: UpdateIaoEventDto, user: any) {
    return {
      isDisplay: iaoEvent.isDisplay,
      eventPhotoUrl: iaoEvent.eventPhotoUrl,
      eventBannerUrl: iaoEvent.eventBannerUrl,
      iaoEventName: iaoEvent.iaoEventName,
      description: iaoEvent.description,
      allocationType: iaoEvent.allocationType,
      whitelistRegistrationUrl: iaoEvent.whitelistRegistrationUrl,
      whitelistAnnouncementTime: iaoEvent.whitelistAnnouncementTime,
      updatedBy: user.adminId,
    };
  }

  convertExportedEvents(data: any[], assetTypes: any[]) {
    const exportedEvents: ExportedIAOEventEntity[] = data.map((event) => {
      let assetCategory = '';
      if (event.iaoRequest.items.length === 1) {
        assetCategory =
          ASSET_CATEGORY_BY_ID[event.iaoRequest.items[0]?.category];
        if (event.iaoRequest.items[0].category === CategoryType.VIRTUAL) {
          if (event.iaoRequest.items[0].isMintNFT)
            assetCategory = `${assetCategory} (NFT)`;
          else assetCategory = `${assetCategory} (Non-NFT)`;
        }
      }
      return {
        iaoEventId: event.iaoEventId,
        iaoEventDuration: event.iaoEventDuration,
        registrationStartTime: Utils.formatDate(event.registrationStartTime),
        registrationEndTime: Utils.formatDate(event.registrationEndTime),
        participationStartTime: Utils.formatDate(event.participationStartTime),
        participationEndTime: Utils.formatDate(event.participationEndTime),
        iaoEventName: event.iaoEventName.en,
        vaultType: VAULT_TYPE_BY_ID[event.vaultType],
        chainId: CHAIN_NAME_BY_ID[event.chainId],
        FNFTcontractAddress: event.FNFTcontractAddress,
        tokenSymbol: event.tokenSymbol,
        totalSupply: event.totalSupply,
        fNftDecimals: FNFT_DECIMAL,
        iaoRequestId: event.iaoRequestId,
        acceptedCurrencyAddress: event.acceptedCurrencyAddress,
        acceptedCurrencySymbol: event.acceptedCurrencySymbol,
        exchangeRate: event.exchangeRate,
        assetValuation: event.exchangeRate * event.totalSupply,
        IAOOffered: event.percentageOffered,
        IAOOfferedToken: (event.percentageOffered * event.totalSupply) / 100,
        vaultUnlockThreshold: event.vaultUnlockThreshold,
        vaultUnlockThresholdToken:
          (event.vaultUnlockThreshold * event.totalSupply) / 100,
        display: event.isDisplay,
        numberOfItems: event.iaoRequest.items.length,
        assetName:
          event.iaoRequest.items.length === 1
            ? event.iaoRequest.items[0]?.name
            : '',
        assetCategory,
        assetType:
          event.iaoRequest.items.length === 1
            ? assetTypes.find(
                (assetType) =>
                  assetType._id.toString() ===
                  event.iaoRequest.items[0].typeId.toString(),
              ).name.en
            : '',
        allocationType: ALLOCATION_TYPE_BY_ID[event.allocationType],
        hardCapPerUser: event.hardCapPerUser,
        hardCapPerUserToken: (event.hardCapPerUser * event.totalSupply) / 100,
        whitelistAnnouncementTime: Utils.formatDate(
          event.whitelistAnnouncementTime,
        ),
        createdBy: `${event.createdByAdmin?.adminId} - ${event.createdByAdmin?.fullname}`,
        createdOn: Utils.formatDate(event.createdAt),
        createdOnChainBy: event.createdOnChainByAdmin
          ? `${event.createdOnChainByAdmin?.adminId} - ${event.createdOnChainByAdmin?.fullname}`
          : '',
        createdOnChainOn: event.createdOnChainAt
          ? Utils.formatDate(event.createdOnChainAt)
          : '',
        updatedBy: `${event.updatedByAdmin?.adminId} - ${event.updatedByAdmin?.fullname}`,
        updatedOn: Utils.formatDate(event.updatedAt),
        lastWhitelistUpdatedBy: event.lastWhitelistUpdatedByAdmin
          ? `${event.lastWhitelistUpdatedByAdmin?.adminId} - ${event.lastWhitelistUpdatedByAdmin?.fullname}`
          : '',
        lastWhitelistUpdatedOn: event.lastWhitelistUpdatedAt
          ? Utils.formatDate(event.lastWhitelistUpdatedAt)
          : '',
      };
    });
    return exportedEvents;
  }

  convertIaoEventToCheckTime(iao: any, type: any) {
    return iao.map((iao: any) => {
      const { iaoEventName, eventPhotoUrl, iaoEventId } = iao;
      const obj: any = {
        iaoEventName,
        eventPhotoUrl,
        iaoEventId,
        eventType: type,
      };
      if (type === IAO_EVENT_CALENDER.REGISTRATION_START)
        obj.date = iao.registrationStartTime;
      if (type === IAO_EVENT_CALENDER.REGISTRATION_END)
        obj.date = iao.registrationEndTime;
      if (type === IAO_EVENT_CALENDER.PARTICIPATION_START)
        obj.date = iao.participationStartTime;
      if (type === IAO_EVENT_CALENDER.PARTICIPATION_END)
        obj.date = iao.registrationEndTime;

      return obj;
    });
  }
}
