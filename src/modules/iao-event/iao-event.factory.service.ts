import { Injectable } from '@nestjs/common';
import moment = require('moment');
import { ON_CHAIN_STATUS } from 'src/datalayer/model';
import { CreateIAOEventEntity } from 'src/entity/create-iao-event.entity';
import { CreateIaoEventDto } from './dto/create-iao-event.dto';

@Injectable()
export class IaoEventBuilderService {
  createIAOEvent(
    createIaoEventDto: CreateIaoEventDto,
    user: any,
  ): CreateIAOEventEntity {
    return {
      iaoEventId: 'fake',
      isDisplay: createIaoEventDto.isDisplay,
      chainId: createIaoEventDto.chainId,
      FNFTcontractAddress: createIaoEventDto.FNFTcontractAddress,
      iaoRequestId: createIaoEventDto.iaoRequestId,
      registrationStartTime: moment(
        createIaoEventDto.registrationStartTime,
        'DD-MM-YYYY HH:MM:SS',
      ).toDate(),
      registrationEndTime: moment(
        createIaoEventDto.registrationEndTime,
        'DD-MM-YYYY HH:MM:SS',
      ).toDate(),
      iaoEventDuration: createIaoEventDto.iaoEventDuration,
      participationStartTime: moment(
        createIaoEventDto.participationStartTime,
        'DD-MM-YYYY HH:MM:SS',
      ).toDate(),
      participationEndTime: moment(
        createIaoEventDto.participationEndTime,
        'DD-MM-YYYY HH:MM:SS',
      ).toDate(),
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
      whitelistAnnouncementTime: moment(
        createIaoEventDto.whitelistAnnouncementTime,
        'DD-MM-YYYY HH:MM:SS',
      ).toDate(),
      onChainStatus: ON_CHAIN_STATUS.DRAFT,
      updatedBy: user.adminId,
      createdBy: user.adminId,
      totalSupply: createIaoEventDto.totalSupply,
    };
  }
}
