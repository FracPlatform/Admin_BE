import { Injectable } from '@nestjs/common';
import { PREFIX_ID } from 'src/common/constants';
import {
  Admin,
  Fractor,
  FractorDocument,
  IAOEvent,
  IAOEventDocument,
  REVENUE_STATUS,
  Whitelist,
  WhitelistDocument,
} from 'src/datalayer/model';
import {
  IAOEventDetailEntity,
  IaoRevenueDetaiLEntity,
  IaoRevenueEntity,
} from 'src/entity/create-iao-event.entity';
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
        revenue: iaoRevenue.revenue,
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

  convertIaorevenueDetail(
    iaoEvent: IAOEvent,
    whiteList: Whitelist,
    fractor: Fractor,
    bd: Admin,
  ) {
    const soldAmount = iaoEvent.totalSupply - iaoEvent.availableSupply;
    const participatedAmount = soldAmount * iaoEvent.exchangeRate;
    const progress = (soldAmount / iaoEvent.totalSupply) * 100;
    const platformGrossCommission =
      (participatedAmount *
        (iaoEvent.revenue.status !== REVENUE_STATUS.APPROVED
          ? fractor.iaoFeeRate
          : iaoEvent.revenue.platformCommissionRate)) /
      100;
    const fractorNetRevenue = participatedAmount - platformGrossCommission;
    const bdCommission =
      (platformGrossCommission * iaoEvent.revenue.bdCommissionRate) / 100;
    const platformNetCommission = platformGrossCommission - bdCommission;
    const iaoEventDetail: IaoRevenueDetaiLEntity = {
      iaoEventId: iaoEvent.iaoEventId,
      iaoEventName: iaoEvent.iaoEventName,
      registrationStartTime: iaoEvent.registrationStartTime,
      registrationEndTime: iaoEvent.registrationEndTime,
      participationStartTime: iaoEvent.participationStartTime,
      participationEndTime: iaoEvent.participationEndTime,
      revenue: {
        platformCommissionRate:
          iaoEvent.revenue.status !== REVENUE_STATUS.APPROVED &&
          fractor.iaoFeeRate,
        ...iaoEvent.revenue,
      },
      soldAmount,
      participatedAmount,
      progress,
      participants: whiteList.whiteListAddresses.length,
      vaultUnlockThreshold: iaoEvent.vaultUnlockThreshold,
      acceptedCurrencySymbol: iaoEvent.acceptedCurrencySymbol,
      tokenSymbol: iaoEvent.tokenSymbol,
      eventBannerUrl: iaoEvent.eventBannerUrl,
      eventPhotoUrl: iaoEvent.eventPhotoUrl,
      fractor: {
        fractorId: fractor.fractorId,
        fullname: fractor.fullname,
      },
      assignBD: {
        adminId: bd.adminId,
        fullname: bd.fullname,
      },
      stage: this.iaoEventService.checkCurrentStage(
        iaoEvent.registrationStartTime,
        iaoEvent.registrationEndTime,
        iaoEvent.participationStartTime,
        iaoEvent.participationEndTime,
        iaoEvent.vaultType,
        iaoEvent.totalSupply - iaoEvent.availableSupply >=
          (iaoEvent.vaultUnlockThreshold * iaoEvent.totalSupply) / 100,
      ),
      platformGrossCommission,
      fractorNetRevenue,
      bdCommission,
      platformNetCommission,
    };
    return iaoEventDetail;
  }
}
