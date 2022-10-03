import { Injectable } from '@nestjs/common';
import moment = require('moment');
import { PREFIX_ID } from 'src/common/constants';
import { Utils } from 'src/common/utils';
import { IDataServices } from 'src/core/abstracts/data-services.abstract';
import { FNFT_DECIMAL, ON_CHAIN_STATUS } from 'src/datalayer/model';
import {
  CreateIAOEventEntity,
  IAOEventDetailEntity,
} from 'src/entity/create-iao-event.entity';
import { CreateIaoEventDto } from './dto/create-iao-event.dto';

@Injectable()
export class IaoEventBuilderService {
  constructor(private readonly dataServices: IDataServices) {}

  async createIAOEvent(
    createIaoEventDto: CreateIaoEventDto,
    user: any,
    session,
  ): Promise<CreateIAOEventEntity> {
    const date = createIaoEventDto.participationStartTime.toString();
    const participationEndTime = new Date(date);
    participationEndTime.setDate(
      participationEndTime.getDate() + createIaoEventDto.iaoEventDuration,
    );

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
      participationEndTime: participationEndTime,
      vaultType: createIaoEventDto.vaultType,
      acceptedCurrencyAddress: createIaoEventDto.acceptedCurrencyAddress,
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
    };
  }

  getIaoEventDetail(
    iaoEvent: any,
    fnft: any,
    iaoRequest: any,
  ): IAOEventDetailEntity {
    return {
      iaoEventId: iaoEvent.iaoEventId,
      status: iaoEvent.status,
      onChainStatus: iaoEvent.onChainStatus,
      currentStage: 0,
      isDisplay: iaoEvent.isDisplay,
      chainId: iaoEvent.chainId,
      FNFTcontractAddress: iaoEvent.FNFTcontractAddress,
      tokenSymbol: fnft.tokenSymbol,
      tokenName: fnft.tokenName,
      tokenLogo: fnft.tokenLogo,
      fnftStatus: fnft.status,
      fnftDecimal: FNFT_DECIMAL,
      iaoRequestStatus: iaoRequest.status,
      iaoRequestType: iaoRequest.type,
      fractor: iaoRequest.fractor,
      bd: iaoRequest.bd,
      iaoRequestDuration: iaoRequest.eventDuration,
      iaoRequestOffer: iaoRequest.percentOffered,
      iaoRequestVaultUnlockThreshold: iaoRequest.percentVault,
      totalItems: iaoRequest.items.length,
      items: iaoRequest.items,
      nfts: fnft.items,
      registrationStartTime: iaoEvent.registrationStartTime,
      registrationEndTime: iaoEvent.registrationEndTime,
      iaoEventDuration: iaoEvent.iaoEventDuration,
      participationStartTime: iaoEvent.participationStartTime,
      participationEndTime: iaoEvent.participationEndTime,
      iaoEventVaultType: iaoEvent.iaoEventVaultType,
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
      updatedBy: iaoEvent.updatedBy,
      createdBy: iaoEvent.createdBy,
      createdAt: iaoEvent.createdAt,
      updatedAt: iaoEvent.updatedAt,
      createdOnChainBy: iaoEvent.createdOnChainBy,
      createdOnChainAt: iaoEvent.createdOnChainAt,
      lastWhitelistUpdatedAt: iaoEvent.lastWhitelistUpdatedAt,
      lastWhitelistUpdatedBy: iaoEvent.lastWhitelistUpdatedBy,
    };
  }
}
