import { Injectable } from '@nestjs/common';
import { IDataServices } from 'src/core/abstracts/data-services.abstract';
import {
  ASSET_STATUS,
  CUSTODIANSHIP_STATUS,
  F_NFT_STATUS,
  IAO_EVENT_STAGE,
  IAO_EVENT_STATUS,
  IAO_REQUEST_STATUS,
  NETWORK,
  NFT_STATUS,
  ON_CHAIN_STATUS,
  REDEMPTION_REQUEST_STATUS,
  REVENUE_STATUS,
} from 'src/datalayer/model';
import { IaoEventService } from '../iao-event/iao-event.service';
import { DashboardDTO } from './dashboard.dto';

@Injectable()
export class DashboardService {
  constructor(
    private readonly dataService: IDataServices,
    private readonly iaoEventService: IaoEventService,
  ) {}

  async getPendingTasks() {
    const iaoRequestPreliminary = await this.dataService.iaoRequest.count({
      status: IAO_REQUEST_STATUS.IN_REVIEW,
    });

    const iaoRequestFinalReview = await this.dataService.iaoRequest.count({
      status: IAO_REQUEST_STATUS.APPROVED_A,
    });

    const assetTransferCustodianship = await this.dataService.asset.count({
      'custodianship.status': CUSTODIANSHIP_STATUS.FRAC,
      network: { $in: [NETWORK.BSC, NETWORK.ETH] },
      deleted: false,
    });

    const assetReviewCustodianship = await this.dataService.asset.count({
      'custodianship.status': CUSTODIANSHIP_STATUS.FRACTOR_TO_FRAC_OR_IN_REVIEW,
      deleted: false,
    });

    const assetDraftNewNFT = await this.dataService.asset.count({
      status: ASSET_STATUS.IAO_APPROVED,
      'custodianship.status': CUSTODIANSHIP_STATUS.FRAC,
    });

    const nftMint = await this.dataService.nft.count({
      status: NFT_STATUS.DRAFT,
    });

    let FNFTCreateIAOEvent = await this.dataService.fnft.count({
      status: F_NFT_STATUS.ACTIVE,
    });
    const iaoEventHaveFnft = await this.dataService.iaoEvent.count({
      status: IAO_EVENT_STATUS.ACTIVE,
      isDeleted: false,
      FNFTcontractAddress: { $exists: true },
    });
    FNFTCreateIAOEvent -= iaoEventHaveFnft;

    const IAOeventCreateOnChain = await this.dataService.iaoEvent.count({
      onChainStatus: ON_CHAIN_STATUS.DRAFT,
    });

    const RedeemAdminReview = await this.dataService.redemptionRequest.count({
      status: REDEMPTION_REQUEST_STATUS.IN_REVIEW,
    });

    const RedeemAdminConfirm = await this.dataService.redemptionRequest.count({
      status: REDEMPTION_REQUEST_STATUS.PROCESSING,
    });

    return {
      iaoRequestPreliminary,
      iaoRequestFinalReview,
      assetTransferCustodianship,
      assetReviewCustodianship,
      assetDraftNewNFT,
      nftMint,
      FNFTCreateIAOEvent,
      IAOeventCreateOnChain,
      RedeemAdminReview,
      RedeemAdminConfirm,
    };
  }

  async getOverview(dashboardDTO: DashboardDTO) {
    let grossRevenue = 0,
      platformGrossCommission = 0,
      fractorRevenue = 0,
      succeeded = 0,
      faild = 0,
      onGoing = 0,
      totalIaoEvent = 0;

    const query = { onChainStatus: ON_CHAIN_STATUS.ON_CHAIN };
    if (dashboardDTO.dateFrom && dashboardDTO.dateTo)
      query['createdAt'] = {
        $gte: dashboardDTO.dateFrom,
        $lte: dashboardDTO.dateTo,
      };

    const iaoEventList = await this.dataService.iaoEvent.findMany(query);
    totalIaoEvent = iaoEventList.length;
    iaoEventList.forEach((iaoEvent) => {
      const currentStage = this.iaoEventService.checkCurrentStage(
        iaoEvent.registrationStartTime,
        iaoEvent.registrationEndTime,
        iaoEvent.participationStartTime,
        iaoEvent.participationEndTime,
        iaoEvent.vaultType,
        iaoEvent.totalSupply - iaoEvent.availableSupply >=
          (iaoEvent.vaultUnlockThreshold * iaoEvent.totalSupply) / 100,
      );
      // succeeded
      if (iaoEvent?.revenue?.status === REVENUE_STATUS.APPROVED) {
        succeeded += 1;
        const soldAmount = iaoEvent.totalSupply - iaoEvent.availableSupply;
        grossRevenue += soldAmount * iaoEvent.exchangeRate;
        platformGrossCommission =
          platformGrossCommission +
            (grossRevenue * iaoEvent?.revenue.platformCommissionRate) / 100 ||
          0;
        fractorRevenue =
          fractorRevenue + grossRevenue - platformGrossCommission;
      }
      //faild
      else if (
        currentStage === IAO_EVENT_STAGE.FAILED ||
        (currentStage === IAO_EVENT_STAGE.COMPLETED &&
          iaoEvent?.revenue?.status === REVENUE_STATUS.REJECTED) ||
        iaoEvent.status === IAO_EVENT_STATUS.INACTIVE
      ) {
        faild += 1;
      }
      // ongoing
      else if (
        currentStage < IAO_EVENT_STAGE.COMPLETED ||
        (currentStage === IAO_EVENT_STAGE.COMPLETED &&
          iaoEvent?.revenue?.status < REVENUE_STATUS.APPROVED)
      ) {
        onGoing += 1;
      } else {
        console.log(currentStage, iaoEvent.revenue.status);
      }
    });

    return {
      grossRevenue,
      platformGrossCommission,
      fractorRevenue,
      iaoEvent: { totalIaoEvent, succeeded, faild, onGoing },
    };
  }
}
