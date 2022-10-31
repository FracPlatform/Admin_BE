import { Injectable } from '@nestjs/common';
import { PREFIX_ID } from 'src/common/constants';
import { IaoRevenueEntity } from 'src/entity/create-iao-event.entity';
import { IaoEventService } from '../iao-event/iao-event.service';

@Injectable()
export class IaoRevenueBuilderService {
  constructor(private readonly iaoEventService: IaoEventService) {}
  convertListIaoRevenue(data: any[]) {
    const listIaoRevenue: IaoRevenueEntity[] = data.map((iaoRevenue) => {
      return {
        iaoEventId: `${PREFIX_ID.IAO_EVENT}-${iaoRevenue.iaoEventId}`,
        iaoEventName: iaoRevenue.iaoEventName,
        registrationStartTime: iaoRevenue.registrationStartTime,
        registrationEndTime: iaoRevenue.registrationEndTime,
        participationStartTime: iaoRevenue.participationStartTime,
        participationEndTime: iaoRevenue.participationEndTime,
        revenueStatus: iaoRevenue.revenueStatus,
        soldAmount: iaoRevenue.soldAmount,
        participatedAmount: iaoRevenue.participatedAmount,
        progress: iaoRevenue.progress,
        participants: iaoRevenue.participants,
        vaultUnlockThreshold: iaoRevenue.vaultUnlockThreshold,
        acceptedCurrencySymbol: iaoRevenue.acceptedCurrencySymbol,
        tokenSymbol: iaoRevenue.tokenSymbol,
        eventBannerUrl: iaoRevenue.eventBannerUrl,
        eventPhotoUrl: iaoRevenue.eventPhotoUrl,
        stage: this.iaoEventService.checkCurrentStage(
          iaoRevenue.registrationStartTime,
          iaoRevenue.registrationEndTime,
          iaoRevenue.participationStartTime,
          iaoRevenue.participationEndTime,
          iaoRevenue.vaultType,
          iaoRevenue.totalSupply - iaoRevenue.availableSupply >=
            (iaoRevenue.vaultUnlockThreshold * iaoRevenue.totalSupply) / 100,
        ),
      };
    });
    return listIaoRevenue;
  }
}
