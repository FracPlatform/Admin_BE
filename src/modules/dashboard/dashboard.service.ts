import { Injectable } from '@nestjs/common';
import { IDataServices } from 'src/core/abstracts/data-services.abstract';
import {
  ASSET_STATUS,
  CUSTODIANSHIP_STATUS,
  F_NFT_STATUS,
  IAO_EVENT_STATUS,
  IAO_REQUEST_STATUS,
  NETWORK,
  NFT_STATUS,
  ON_CHAIN_STATUS,
  REDEMPTION_REQUEST_STATUS,
} from 'src/datalayer/model';

@Injectable()
export class DashboardService {
  constructor(private readonly dataService: IDataServices) {}

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
}
