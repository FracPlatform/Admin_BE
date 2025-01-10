import { Injectable } from '@nestjs/common';
import { PREFIX_ID, VAULT_TYPE_BY_ID } from 'src/common/constants';
import { Utils } from 'src/common/utils';
import {
  Admin,
  FIAT_CURRENCY,
  Fractor,
  IAOEvent,
  IAO_EVENT_STAGE,
  Nft,
  REVENUE_STATUS,
  Whitelist,
} from 'src/datalayer/model';
import {
  ExportedIaoRevenueEntity,
  IaoRevenueDetaiLEntity,
  IaoRevenueEntity,
} from 'src/entity/create-iao-event.entity';
import { IaoEventService } from '../iao-event/iao-event.service';

export const IAO_STAGE_BY_ID: { [key: number | string]: string } = {
  [IAO_EVENT_STAGE.COMPLETED]: 'Completed',
  [IAO_EVENT_STAGE.FAILED]: 'Failed',
  [IAO_EVENT_STAGE.ON_SALE]: 'On Sale',
  [IAO_EVENT_STAGE.ON_SALE_SOON]: 'On Sale Soon',
  [IAO_EVENT_STAGE.REGISTER_NOW]: 'Register Now',
  [IAO_EVENT_STAGE.UPCOMING]: 'Upcomming',
};

export const IAO_REVENUE_STATUS_BY_ID: { [key: number | string]: string } = {
  [REVENUE_STATUS.APPROVED]: 'Approved',
  [REVENUE_STATUS.CLOSED]: 'Closed',
  [REVENUE_STATUS.IN_REVIEW]: 'In Review',
  [REVENUE_STATUS.PENDING]: 'Pending',
  [REVENUE_STATUS.REJECTED]: 'Rejected',
};

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
        participatedByFiatAmount: iaoRevenue.participatedByFiatAmount,
        fiatSymbol: FIAT_CURRENCY.SGD,
        progress: iaoRevenue.progress,
        participants: iaoRevenue.participants,
        vaultUnlockThreshold: iaoRevenue.vaultUnlockThreshold,
        acceptedCurrencySymbol: iaoRevenue.acceptedCurrencySymbol,
        tokenSymbol: iaoRevenue.tokenSymbol,
        currencyDecimal: iaoRevenue.currencyDecimal,
        eventBannerUrl: iaoRevenue.eventBannerUrl,
        eventPhotoUrl: iaoRevenue.eventPhotoUrl,
        vaultType: iaoRevenue.vaultType,
        nfts: iaoRevenue.nfts,
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

  convertIaoRevenueDetail(
    iaoEvent: IAOEvent,
    whiteList: Whitelist,
    fractor: Fractor,
    bd: Admin,
    listNft: Nft[],
    updatedByAdmin: Admin,
    finalizedByAdmin: Admin,
  ) {
    const participatedByFiatAmount = iaoEvent.participatedByFiatAmount || 0;
    const soldAmountByFiat = iaoEvent.soldAmountByFiat || 0;
    const soldAmount = iaoEvent.totalSupply - iaoEvent.availableSupply;
    const participatedAmount = (soldAmount - soldAmountByFiat) * iaoEvent.exchangeRate;
    const progress = (soldAmount / iaoEvent.totalSupply) * 100;
    const platformGrossCommission =
      (participatedAmount *
        (iaoEvent.revenue.status !== REVENUE_STATUS.APPROVED
          ? fractor.iaoFeeRate || 0
          : iaoEvent.revenue.platformCommissionRate || 0)) /
      100;
    const platformGrossCommissionByFiat =
      (participatedByFiatAmount *
        (iaoEvent.revenue.status !== REVENUE_STATUS.APPROVED
          ? fractor.iaoFeeRate || 0
          : iaoEvent.revenue.platformCommissionRate || 0)) /
      100;
    const fractorNetRevenue = participatedAmount - platformGrossCommission;
    const fractorNetRevenueByFiat = participatedByFiatAmount - platformGrossCommissionByFiat;
    const bdCommission =
      (platformGrossCommission * iaoEvent.revenue.bdCommissionRate) / 100;
    const bdCommissionByFiat =
      (platformGrossCommissionByFiat * iaoEvent.revenue.bdCommissionRate) / 100;
    const platformNetCommission = platformGrossCommission - bdCommission;
    const platformNetCommissionByFiat = platformGrossCommissionByFiat - bdCommissionByFiat;
    const iaoEventDetail: IaoRevenueDetaiLEntity = {
      iaoEventId: iaoEvent.iaoEventId,
      iaoEventName: iaoEvent.iaoEventName,
      currencyDecimal: iaoEvent.currencyDecimal,
      registrationStartTime: iaoEvent.registrationStartTime,
      registrationEndTime: iaoEvent.registrationEndTime,
      participationStartTime: iaoEvent.participationStartTime,
      participationEndTime: iaoEvent.participationEndTime,
      revenue: {
        platformCommissionRate:
          iaoEvent.revenue.status !== REVENUE_STATUS.APPROVED
            ? fractor.iaoFeeRate
            : 0,
        ...iaoEvent.revenue,
      },
      soldAmount,
      participatedAmount,
      participatedByFiatAmount: participatedByFiatAmount,
      fiatSymbol: FIAT_CURRENCY.SGD,
      progress,
      participants: whiteList?.whiteListAddresses?.length || 0,
      vaultUnlockThreshold: iaoEvent.vaultUnlockThreshold,
      acceptedCurrencySymbol: iaoEvent.acceptedCurrencySymbol,
      tokenSymbol: iaoEvent.tokenSymbol,
      eventBannerUrl: iaoEvent.eventBannerUrl,
      eventPhotoUrl: iaoEvent.eventPhotoUrl,
      fractor: {
        fractorId: fractor?.fractorId,
        fullname: fractor?.fullname,
      },
      assignedBD: {
        adminId: bd?.adminId,
        fullname: bd?.fullname,
      },
      vaultType: iaoEvent.vaultType,
      stage: this.iaoEventService.checkCurrentStage(
        iaoEvent.registrationStartTime,
        iaoEvent.registrationEndTime,
        iaoEvent.participationStartTime,
        iaoEvent.participationEndTime,
        iaoEvent.vaultType,
        iaoEvent.totalSupply - iaoEvent.availableSupply >=
          (iaoEvent.vaultUnlockThreshold * iaoEvent.totalSupply) / 100,
      ),
      platformGrossCommission:
        iaoEvent.revenue.status === REVENUE_STATUS.APPROVED &&
        platformGrossCommission,
      fractorNetRevenue:
        iaoEvent.revenue.status === REVENUE_STATUS.APPROVED &&
        fractorNetRevenue,
      bdCommission:
        iaoEvent.revenue.status === REVENUE_STATUS.APPROVED && bdCommission,
      platformNetCommission:
        iaoEvent.revenue.status === REVENUE_STATUS.APPROVED &&
        platformNetCommission,
      platformGrossCommissionByFiat:
        iaoEvent.revenue.status === REVENUE_STATUS.APPROVED &&
        platformGrossCommissionByFiat,
      fractorNetRevenueByFiat:
        iaoEvent.revenue.status === REVENUE_STATUS.APPROVED &&
        fractorNetRevenueByFiat,
      bdCommissionByFiat:
        iaoEvent.revenue.status === REVENUE_STATUS.APPROVED && bdCommissionByFiat,
      platformNetCommissionByFiat:
        iaoEvent.revenue.status === REVENUE_STATUS.APPROVED &&
        platformNetCommissionByFiat,
      nfts: listNft,
      updatedByAdmin: updatedByAdmin
        ? {
            adminId: updatedByAdmin?.adminId,
            fullname: updatedByAdmin?.fullname,
          }
        : null,
      finalizedByAdmin: finalizedByAdmin
        ? {
            adminId: finalizedByAdmin?.adminId,
            fullname: finalizedByAdmin?.fullname,
          }
        : null,
    };
    return iaoEventDetail;
  }

  convertExportedIaoRevenue(listIaoRevenue: any[]) {
    const exportedIaoRevenue: ExportedIaoRevenueEntity[] = listIaoRevenue.map(
      (iaoRevenue) => {
        const participatedByFiatAmount = iaoRevenue.participatedByFiatAmount || 0;
        const soldAmountByFiat = iaoRevenue.soldAmountByFiat || 0;
        const soldAmount = iaoRevenue.totalSupply - iaoRevenue.availableSupply;
        const participatedAmount = (soldAmount - soldAmountByFiat) * iaoRevenue.exchangeRate;
        const platformGrossCommission =
          (participatedAmount *
            (iaoRevenue.revenue.status !== REVENUE_STATUS.APPROVED
              ? iaoRevenue.fractor.iaoFeeRate || 0
              : iaoRevenue.revenue.platformCommissionRate || 0)) /
          100;
        const fractorNetRevenue = participatedAmount - platformGrossCommission;
        const bdCommission =
          (platformGrossCommission *
            (iaoRevenue.revenue.bdCommissionRate || 0)) /
          100;
        const platformGrossCommissionByFiat =
            (participatedByFiatAmount *
              (iaoRevenue.revenue.status !== REVENUE_STATUS.APPROVED
                ? iaoRevenue.fractor.iaoFeeRate || 0
                : iaoRevenue.revenue.platformCommissionRate || 0)) /
            100;

        const fractorNetRevenueByFiat = participatedByFiatAmount - platformGrossCommissionByFiat;
        const bdCommissionByFiat =
          (platformGrossCommissionByFiat * (iaoRevenue.revenue.bdCommissionRate || 0)) / 100;
        return {
          iaoEventId: `${PREFIX_ID.IAO_EVENT} - ${iaoRevenue.iaoEventId}`,
          participationStartTime: Utils.formatDate(
            iaoRevenue.participationStartTime,
          ),
          participationEndTime: Utils.formatDate(
            iaoRevenue.participationEndTime,
          ),
          iaoEventName: iaoRevenue.iaoEventName.en,
          vaultType: VAULT_TYPE_BY_ID[iaoRevenue.vaultType],
          stage:
            IAO_STAGE_BY_ID[
              this.iaoEventService.checkCurrentStage(
                iaoRevenue.registrationStartTime,
                iaoRevenue.registrationEndTime,
                iaoRevenue.participationStartTime,
                iaoRevenue.participationEndTime,
                iaoRevenue.vaultType,
                iaoRevenue.totalSupply - iaoRevenue.availableSupply >=
                  (iaoRevenue.vaultUnlockThreshold * iaoRevenue.totalSupply) /
                    100,
              )
            ],
          revenueStatus: IAO_REVENUE_STATUS_BY_ID[iaoRevenue.revenue.status],
          acceptedCurrencySymbol: iaoRevenue.acceptedCurrencySymbol,
          participatedAmount,
          participatedByFiatAmount: participatedByFiatAmount,
          // fiatSymbol: FIAT_CURRENCY.SGD,
          grossRevenue:
            iaoRevenue.revenue.status !== REVENUE_STATUS.APPROVED
              ? 0
              : participatedAmount,
          grossRevenueByFiat:
              iaoRevenue.revenue.status !== REVENUE_STATUS.APPROVED
                ? 0
                : participatedByFiatAmount,
          platformComissionRate:
            iaoRevenue.revenue.status !== REVENUE_STATUS.APPROVED
              ? `${iaoRevenue.fractor.iaoFeeRate || 0}%`
              : `${iaoRevenue.revenue.platformCommissionRate || 0}%`,
          platformGrossCommission,
          platformGrossCommissionByFiat,
          fractorNetRevenue,
          fractorNetRevenueByFiat,
          bdCommission,
          bdCommissionByFiat,
          fractor: iaoRevenue.fractor
            ? `${iaoRevenue.fractor.fractorId} - ${iaoRevenue.fractor.fullname}`
            : '',
          assignedBD: iaoRevenue.bd
            ? `${iaoRevenue.bd?.adminId} - ${iaoRevenue.bd?.fullname}`
            : '',
          finalizedOn: iaoRevenue.finalizedByAdmin
            ? Utils.formatDate(iaoRevenue.revenue.finalizedOn)
            : '',
          finalizedBy: iaoRevenue.finalizedByAdmin
            ? `${iaoRevenue.finalizedByAdmin?.adminId} - ${iaoRevenue.finalizedByAdmin?.fullname}`
            : '',
        };
      },
    );
    return exportedIaoRevenue;
  }
}
