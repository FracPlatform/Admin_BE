import { Injectable } from '@nestjs/common';
import { IDataServices } from 'src/core/abstracts/data-services.abstract';
import {
  ASSET_STATUS,
  CategoryType,
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
  USER_ROLE,
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

    const query = {};
    if (dashboardDTO.dateFrom && dashboardDTO.dateTo)
      query['createdAt'] = {
        $gte: dashboardDTO.dateFrom,
        $lte: dashboardDTO.dateTo,
      };

    const iaoEventList = await this.dataService.iaoEvent.findMany(query, {
      registrationStartTime: 1,
      registrationEndTime: 1,
      participationStartTime: 1,
      participationEndTime: 1,
      vaultType: 1,
      totalSupply: 1,
      availableSupply: 1,
      vaultUnlockThreshold: 1,
      revenue: 1,
      exchangeRate: 1,
    });
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

  async getStatistics() {
    const asset = await this.dataService.asset.findMany(
      {
        status: ASSET_STATUS.FRACTIONALIZED,
      },
      { category: 1 },
    );
    const totalAsset = asset.length;
    const totalPhysicalAsset = asset.filter(
      (item) => item.category === CategoryType.PHYSICAL,
    ).length;
    const totalDigitalAsset = totalAsset - totalPhysicalAsset;
    const totalFractor = await this.dataService.fractor.count({});
    const totalAffiliate = await this.dataService.user.count({
      role: {
        $in: [
          USER_ROLE.MASTER_AFFILIATE,
          USER_ROLE.AFFILIATE_SUB_1,
          USER_ROLE.AFFILIATE_SUB_2,
        ],
      },
    });
    const totalTrader = await this.dataService.user.count({
      role: USER_ROLE.NORMAL,
    });
    const totalIAORequest = await this.dataService.iaoRequest.count({});
    const totalItem = await this.dataService.asset.count({});
    const totalNFT = await this.dataService.nft.count({});
    const totalFNFT = await this.dataService.fnft.count({});
    const tradingPairs = 0;
    return {
      totalAsset,
      totalPhysicalAsset,
      totalDigitalAsset,
      general: {
        totalFractor,
        totalAffiliate,
        totalTrader,
        totalIAORequest,
        totalItem,
        totalNFT,
        totalFNFT,
        tradingPairs,
      },
    };
  }
}
