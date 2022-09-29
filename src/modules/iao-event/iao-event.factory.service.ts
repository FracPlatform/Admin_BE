import { Injectable } from '@nestjs/common';
import moment = require('moment');
import { PREFIX_ID } from 'src/common/constants';
import { Utils } from 'src/common/utils';
import { IDataServices } from 'src/core/abstracts/data-services.abstract';
import { ON_CHAIN_STATUS } from 'src/datalayer/model';
import { CreateIAOEventEntity } from 'src/entity/create-iao-event.entity';
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
}
