import { Injectable, Logger } from '@nestjs/common';
import { ApiError } from '../../common/api';
import {
  BASE_COINGECKO_URL,
  CONTRACT_EVENTS,
  ErrorCode,
  PREFIX_ID,
  TOKEN_STANDARD_BY_ID,
} from '../../common/constants';
import { IDataServices } from '../../core/abstracts/data-services.abstract';
import {
  ADMIN_STATUS,
  CLAIM_STATUS,
  CLAIM_TYPE,
  FNFT_DECIMAL,
  FractorRevenue,
  F_NFT_MINTED_STATUS,
  F_NFT_STATUS,
  F_NFT_TYPE,
  IAO_EVENT_STATUS,
  IAO_REQUEST_STATUS,
  ON_CHAIN_STATUS,
  PURCHASE_STATUS,
  REVENUE_STATUS,
  WITHDRAWAL_REQUEST_STATUS,
} from '../../datalayer/model';
import { Role } from '../../modules/auth/role.enum';
import { SOCKET_EVENT } from '../socket/socket.enum';
import { SocketGateway } from '../socket/socket.gateway';
import { WorkerDataDto } from './dto/worker-data.dto';
import { NFT_STATUS } from 'src/datalayer/model/nft.model';
import {
  ASSET_STATUS,
  CUSTODIANSHIP_STATUS,
  REVIEW_STATUS,
} from 'src/datalayer/model/asset.model';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { CommonService } from 'src/common-service/common.service';
import { DepositedNFT } from 'src/entity';
import axios from 'axios';
import BigNumber from 'bignumber.js';
const jwt = require('jsonwebtoken');

@Injectable()
export class WorkerService {
  private readonly logger = new Logger(WorkerService.name);

  constructor(
    private readonly dataServices: IDataServices,
    private readonly socketGateway: SocketGateway,
    private readonly commonService: CommonService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async generateToken() {
    const payload = { address: 'Worker', role: '' };
    const token = jwt.sign(payload, process.env.JWT_SECRET);
    return { token };
  }

  async receivedData(requestData: WorkerDataDto) {
    try {
      switch (requestData.eventName) {
        case CONTRACT_EVENTS.SET_ADMIN:
          await this._handleSetAdminEvent(requestData);
          break;
        case CONTRACT_EVENTS.MINT_NFT:
          await this._handleMintNFTEvent(requestData);
          break;
        case CONTRACT_EVENTS.MINT_F_NFT:
          await this._handleMintFNFTEvent(requestData);
          break;
        case CONTRACT_EVENTS.CREATE_IAO_EVENT_ON_CHAIN:
          await this._handleCreateIaoEventOnChain(requestData);
          break;
        case CONTRACT_EVENTS.DEACTIVE_F_NFT:
          await this._handleDeactiveFNFT(requestData);
          break;
        case CONTRACT_EVENTS.DEACTIVE_IAO_EVENT:
          await this._handleDeactiveIaoEvent(requestData);
          break;
        case CONTRACT_EVENTS.DEPOSIT_NFTS:
          await this._handleDepositNFTsEvent(requestData);
          break;
        case CONTRACT_EVENTS.CLAIM_FNFT_SUCCESSFUL:
          await this._handleClaimFNFTEvent(requestData);
          break;
        case CONTRACT_EVENTS.CLAIM_FNFT_FAILURE:
          await this._handleClaimFNFTEvent(requestData);
          break;
        case CONTRACT_EVENTS.DEPOSIT_FUND_EVENT:
          await this._handleDepositFundEvent(requestData);
          break;
        case CONTRACT_EVENTS.MERGE_FNFT:
          await this._handleMergeFNFTEvent(requestData);
          break;
        case CONTRACT_EVENTS.APPROVE_IAO_REVENUE_EVENT:
          await this._handleApproveIaoRevenueEvent(requestData);
          break;
        case CONTRACT_EVENTS.REJECT_IAO_REVENUE:
          await this._handleRejectIaoRevenueEvent(requestData);
          break;
        case CONTRACT_EVENTS.FRACTOR_CLAIM_EVENT:
          await this._handleFractorClaimEvent(requestData);
          break;
        default:
          break;
      }
    } catch (err) {
      this.logger.debug(err.message, err.stack);
      throw ApiError('Webhook err', err.message);
    }
  }

  private async _handleClaimFNFTEvent(requestData: WorkerDataDto) {
    const type =
      requestData.eventName === CONTRACT_EVENTS.CLAIM_FNFT_FAILURE
        ? CLAIM_TYPE.REFUND
        : CLAIM_TYPE.FNFT;
    let decimalToken = 18;
    if (requestData.eventName === CONTRACT_EVENTS.CLAIM_FNFT_FAILURE) {
      const iaoEventDetail = await this.dataServices.iaoEvent.findOne({
        iaoEventId: this.commonService.decodeHexToString(
          requestData.metadata.id,
        ),
      });
      decimalToken = iaoEventDetail.currencyDecimal;
    }

    await this.dataServices.claim.create({
      amount: requestData.metadata.amount,
      buyerAddress: requestData.metadata.sender,
      iaoEventId: this.commonService.decodeHexToString(requestData.metadata.id),
      status: CLAIM_STATUS.SUCCESS,
      type,
      decimal: decimalToken,
    });

    const SOCKET_EVENT_NAME =
      requestData.eventName === CONTRACT_EVENTS.CLAIM_FNFT_SUCCESSFUL
        ? SOCKET_EVENT.CLAIM_FNFT_SUCCESSFUL_EVENT
        : SOCKET_EVENT.CLAIM_FNFT_FAILURE_EVENT;

    this.socketGateway.sendMessage(
      SOCKET_EVENT_NAME,
      requestData,
      requestData.metadata.sender,
    );
  }

  private async _handleSetAdminEvent(requestData: WorkerDataDto) {
    // if role receive contract 0 -> deactive, #0 -> active
    if (+requestData.metadata.role === Role.Deactive) {
      // deactive
      await this.dataServices.admin.findOneAndUpdate(
        { adminId: requestData.metadata.adminId },
        {
          status: ADMIN_STATUS.INACTIVE,
          role: Role.Deactive,
          lastUpdateBy: requestData.metadata.setBy,
        },
      );
      this.socketGateway.sendMessage(
        SOCKET_EVENT.DEACTIVE_ADMIN_EVENT,
        requestData,
        requestData.metadata.caller,
      );
    } else {
      // active
      await this.dataServices.admin.findOneAndUpdate(
        { adminId: requestData.metadata.adminId },
        {
          status: ADMIN_STATUS.ACTIVE,
          lastUpdateBy: requestData.metadata.setBy,
        },
      );
      this.socketGateway.sendMessage(
        SOCKET_EVENT.ACTIVE_ADMIN_EVENT,
        requestData,
        requestData.metadata.caller,
      );
    }
  }

  private async _handleMintNFTEvent(requestData: WorkerDataDto) {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      if (requestData.metadata) {
        const mintedBy = await this.dataServices.admin.findOne({
          walletAddress: {
            $regex: requestData.metadata.mintBy,
            $options: 'i',
          },
        });
        const nft = await this.dataServices.nft.findOneAndUpdate(
          {
            tokenId: `${PREFIX_ID.NFT}-${requestData.metadata.nftId}`,
          },
          {
            $set: {
              status: NFT_STATUS.MINTED,
              mintingHashTx: requestData.transactionHash,
              mintedAt: new Date(),
              mintedBy: mintedBy.adminId,
            },
          },
          { session },
        );
        if (nft.assetId) {
          await this.dataServices.asset.findOneAndUpdate(
            {
              itemId: nft.assetId,
            },
            {
              $set: {
                status: ASSET_STATUS.CONVERTED_TO_NFT,
              },
            },
            { session },
          );
        }
        await session.commitTransaction();
        this.socketGateway.sendMessage(
          SOCKET_EVENT.MINT_NFT_EVENT,
          requestData,
          requestData.metadata.mintBy,
        );
      }
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  private async _handleMintFNFTEvent(requestData: WorkerDataDto) {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const admin = await this.dataServices.admin.findOne({
        walletAddress: requestData.metadata.mintBy,
      });

      const currentFnft = await this.dataServices.fnft.findOneAndUpdate(
        { fnftId: requestData.metadata.fnftId },
        {
          mintedStatus: F_NFT_MINTED_STATUS.MINTED,
          contractAddress: requestData.metadata.fracTokenAddr,
          fractionalizedBy: admin.adminId,
          fractionalizedOn: new Date(),
          txhash: requestData.transactionHash,
        },
        { session: session },
      );

      if (currentFnft.iaoRequestId) {
        await this.dataServices.iaoRequest.findOneAndUpdate(
          { iaoId: currentFnft.iaoRequestId },
          {
            status: IAO_REQUEST_STATUS.CLOSED,
          },
          { session: session },
        );
      }

      const nfts = await this.dataServices.nft.findMany(
        { tokenId: { $in: currentFnft.items } },
        {
          assetId: 1,
        },
      );

      const tokenIds = currentFnft.items;
      const assetIds = nfts.filter((x) => x.assetId).map((x) => x.assetId);

      await this.dataServices.nft.updateMany(
        { tokenId: { $in: tokenIds } },
        { $set: { status: NFT_STATUS.FRACTIONLIZED } },
        { session: session },
      );

      if (assetIds.length > 0) {
        await this.dataServices.asset.updateMany(
          { itemId: { $in: assetIds } },
          { $set: { status: ASSET_STATUS.FRACTIONALIZED } },
          { session: session },
        );
      }

      await session.commitTransaction();

      this.socketGateway.sendMessage(
        SOCKET_EVENT.MINT_F_NFT_EVENT,
        requestData,
        requestData.metadata.mintBy,
      );
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  private async _handleCreateIaoEventOnChain(requestData: WorkerDataDto) {
    const admin = await this.dataServices.admin.findOne({
      walletAddress: {
        $regex: requestData.metadata.createdBy,
        $options: 'i',
      },
    });

    const iaoId = this.commonService.decodeHexToString(
      requestData.metadata.iaoId,
    );

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      // update status,onChainStatus,create by iao event
      await this.dataServices.iaoEvent.updateOne(
        {
          iaoEventId: iaoId,
          status: IAO_EVENT_STATUS.ACTIVE,
          onChainStatus: ON_CHAIN_STATUS.DRAFT,
          isDeleted: false,
        },
        {
          $set: {
            onChainStatus: ON_CHAIN_STATUS.ON_CHAIN,
            createdOnChainAt: new Date(),
            createdOnChainBy: admin.adminId,
          },
        },
        { session },
      );

      // update asset status
      const fnft = await this.dataServices.fnft.findOne({
        contractAddress: requestData.metadata.fracTokenAddress,
        status: F_NFT_STATUS.ACTIVE,
      });
      if (fnft.fnftType === F_NFT_TYPE.AUTO_IMPORT) {
        const iaoRequest = await this.dataServices.iaoRequest.findOne({
          iaoId: fnft.iaoRequestId,
        });
        let items: any = iaoRequest.items;
        items = items.map((i) => {
          return { itemId: i };
        });
        await this.dataServices.asset.updateMany(
          { $or: items },
          { $set: { status: ASSET_STATUS.IAO_EVENT } },
          { session },
        );
      }

      await session.commitTransaction();
      this.socketGateway.sendMessage(
        SOCKET_EVENT.CREATE_IAO_EVENT_ON_CHAIN,
        requestData,
        requestData.metadata.createdBy,
      );
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  private async _handleDeactiveFNFT(requestData: WorkerDataDto) {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const currentFnft = await this.dataServices.fnft.findOneAndUpdate(
        { contractAddress: requestData.metadata.fractTokenAddress },
        {
          status: F_NFT_STATUS.INACTIVE,
        },
        { session: session },
      );

      if (currentFnft.iaoRequestId) {
        await this.dataServices.iaoRequest.findOneAndUpdate(
          { iaoId: currentFnft.iaoRequestId },
          {
            status: IAO_REQUEST_STATUS.APPROVED_B,
          },
          { session: session },
        );
      }

      const nfts = await this.dataServices.nft.findMany(
        { tokenId: { $in: currentFnft.items } },
        {
          assetId: 1,
        },
      );

      const tokenIds = currentFnft.items;
      const assetIds = nfts.filter((x) => x.assetId).map((x) => x.assetId);

      await this.dataServices.nft.updateMany(
        { tokenId: { $in: tokenIds } },
        { $set: { status: NFT_STATUS.MINTED } },
        { session: session },
      );

      if (assetIds.length > 0) {
        await this.dataServices.asset.updateMany(
          { itemId: { $in: assetIds } },
          { $set: { status: ASSET_STATUS.CONVERTED_TO_NFT } },
          { session: session },
        );
      }

      await session.commitTransaction();
      this.socketGateway.sendMessage(
        SOCKET_EVENT.DEACTIVE_F_NFT,
        requestData,
        requestData.metadata.setBy,
      );
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  private async _handleDeactiveIaoEvent(requestData: WorkerDataDto) {
    /**
     * update status of iao event
     * update status of asset
     */

    const admin = await this.dataServices.admin.findOne({
      walletAddress: {
        $regex: requestData.metadata.caller,
        $options: 'i',
      },
    });

    const iaoId = this.commonService.decodeHexToString(
      requestData.metadata.iaoId,
    );

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      // update status,onChainStatus,create by iao event
      await this.dataServices.iaoEvent.updateOne(
        {
          iaoEventId: iaoId,
          status: IAO_EVENT_STATUS.ACTIVE,
          onChainStatus: ON_CHAIN_STATUS.ON_CHAIN,
          isDeleted: false,
        },
        {
          $set: {
            status: IAO_EVENT_STATUS.INACTIVE,
            updatedAt: new Date(),
            updatedBy: admin.adminId,
          },
        },
        { session },
      );

      // update asset status
      const iaoEvent = await this.dataServices.iaoEvent.findOne({
        iaoEventId: iaoId,
      });
      const fnft = await this.dataServices.fnft.findOne({
        contractAddress: iaoEvent.FNFTcontractAddress,
        status: F_NFT_STATUS.ACTIVE,
      });
      if (fnft.fnftType === F_NFT_TYPE.AUTO_IMPORT) {
        const iaoRequest = await this.dataServices.iaoRequest.findOne({
          iaoId: fnft.iaoRequestId,
        });
        let items: any = iaoRequest.items;
        items = items.map((i) => {
          return { itemId: i };
        });
        await this.dataServices.asset.updateMany(
          { $or: items },
          { $set: { status: ASSET_STATUS.FRACTIONALIZED } },
          { session },
        );
      }
      //
      await session.commitTransaction();
      this.socketGateway.sendMessage(
        SOCKET_EVENT.DEACTIVE_IAO_EVENT,
        requestData,
        requestData.metadata.caller,
      );
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  private async _handleDepositNFTsEvent(requestData: WorkerDataDto) {
    const asset = await this.dataServices.asset.findOne({
      itemId: requestData.metadata.assetId,
    });
    if (!asset) throw ApiError(ErrorCode.DEFAULT_ERROR, 'Asset not exists');
    if (asset.status < ASSET_STATUS.IAO_APPROVED)
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'Can not deposit');
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const { data } = await axios.get(requestData.metadata.uri);
      const depositedNFT: DepositedNFT = {
        contractAddress: requestData.metadata.nftAddr,
        tokenId: requestData.metadata.tokenId,
        balance: parseInt(requestData.metadata.tokenAmount),
        depositedOn: new Date(),
        status: REVIEW_STATUS.IN_REVIEW,
        tokenStandard: TOKEN_STANDARD_BY_ID[requestData.metadata.tokenType],
        txHash: requestData.transactionHash,
        withdrawable: 0,
        metadata: {
          name: data.name,
          image: data.image,
          animation_url: data.animation_url,
        },
      };
      const res = await this.dataServices.asset.findOneAndUpdate(
        {
          itemId: `${PREFIX_ID.ASSET}-${requestData.metadata.assetId}`,
        },
        {
          $push: { depositedNFTs: depositedNFT },
        },
        { session },
      );
      if (res)
        this.socketGateway.sendMessage(
          SOCKET_EVENT.DEPOSIT_NFTS,
          requestData,
          requestData.metadata.sender,
        );
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  private async _handleDepositFundEvent(requestData: WorkerDataDto) {
    /**
     * update status purchase PROCESS => SUCCESS
     * update avalibleSupply FNFT,avalibleSupply IAO Event
     */
    const purchaseId = requestData.metadata.internalTxId.substring(2);
    const transactionHash = requestData.transactionHash;
    const buyer = requestData.metadata.buyer;

    const purchase = await this.dataServices.purchase.findOne({
      _id: purchaseId,
    });
    const iaoEvent = await this.dataServices.iaoEvent.findOne({
      iaoEventId: purchase.iaoEventId,
    });

    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      // update purchase
      await this.dataServices.purchase.updateOne(
        { _id: purchaseId },
        { status: PURCHASE_STATUS.SUCCESS, transactionHash },
        { session },
      );

      // update iao event
      await this.dataServices.iaoEvent.updateOne(
        {
          iaoEventId: purchase.iaoEventId,
          availableSupply: { $gte: purchase.tokenAmount },
        },
        {
          $inc: {
            availableSupply: -purchase.tokenAmount,
          },
        },
        { session },
      );

      // update FNFT
      await this.dataServices.fnft.updateOne(
        {
          contractAddress: iaoEvent.FNFTcontractAddress,
          availableSupply: { $gte: purchase.tokenAmount },
        },
        {
          $inc: {
            availableSupply: -purchase.tokenAmount,
          },
        },
        { session },
      );

      // whitelist
      const wl = await this.dataServices.whitelist.findOne({
        iaoEventId: purchase.iaoEventId,
      });
      let whiteListAddresses = wl.whiteListAddresses;
      whiteListAddresses = whiteListAddresses.map((user) => {
        if (user.walletAddress === buyer) {
          user.deposited = +requestData.metadata.totalFundDeposited;
          user.purchased = +requestData.metadata.totalFNFT;
        }
        return user;
      });
      await this.dataServices.whitelist.updateOne(
        {
          iaoEventId: purchase.iaoEventId,
        },
        { whiteListAddresses },
        { session },
      );

      await session.commitTransaction();
      this.socketGateway.sendMessage(
        SOCKET_EVENT.DEPOSIT_FUND_EVENT,
        requestData,
        requestData.metadata.buyer,
      );
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
  private async _handleMergeFNFTEvent(requestData: WorkerDataDto) {
    const listTokenIds = requestData.metadata.tokenIds.map(
      (tokenId) => `${PREFIX_ID.NFT}-${tokenId}`,
    );
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      await this.dataServices.nft.updateMany(
        {
          tokenId: {
            $in: listTokenIds,
          },
        },
        {
          status: NFT_STATUS.OWNED,
        },
        { session },
      );
      const listOwnedNfts = await this.dataServices.nft.findMany({
        tokenId: {
          $in: listTokenIds,
        },
      });
      const listOwnedAssets = listOwnedNfts.map((nft) => nft.assetId);
      await this.dataServices.asset.updateMany(
        {
          itemId: {
            $in: listOwnedAssets,
          },
        },
        {
          $set: {
            'custodianship.status':
              CUSTODIANSHIP_STATUS.AVAILABLE_FOR_USER_TO_REDEEM,
          },
        },
        { session },
      );
      await session.commitTransaction();
      this.socketGateway.sendMessage(
        SOCKET_EVENT.MERGE_FNFT_EVENT,
        requestData,
        requestData.metadata.receiver,
      );
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
  private async _handleApproveIaoRevenueEvent(requestData: WorkerDataDto) {
    const iaoEventId = this.commonService.decodeHexToString(
      requestData.metadata.iaoId,
    );
    const fractorId = this.commonService.decodeHexToString(
      requestData.metadata.fractorId,
    );
    const iaoEvent = await this.dataServices.iaoEvent.findOne({
      iaoEventId,
    });
    const admin = await this.dataServices.admin.findOne({
      walletAddress: {
        $regex: requestData.metadata.caller,
        $options: 'i',
      },
    });
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      await this.dataServices.iaoEvent.updateOne(
        {
          iaoEventId,
        },
        {
          $set: {
            'revenue.status': REVENUE_STATUS.APPROVED,
            'revenue.finalizedOn': new Date(),
            'revenue.finalizedBy': admin.adminId,
          },
        },
      );

      const tokenInfo = await axios.get(
        `${BASE_COINGECKO_URL}/coins/binance-smart-chain/contract/${iaoEvent.FNFTcontractAddress}/market_chart/?vs_currency=usd&days=0`,
      );
      const tokenUsdPrice = tokenInfo.data.prices[0][1];

      const newApproveIaoRevenue: FractorRevenue = {
        isWithdrawed: false,
        balance: new BigNumber(requestData.metadata.revenue)
          .dividedBy(Math.pow(10, FNFT_DECIMAL))
          .toNumber(),
        currencyContract: iaoEvent.acceptedCurrencyAddress,
        approveAcceptedCurrencyUsdPrice: tokenUsdPrice,
        acceptedCurrencySymbol: iaoEvent.acceptedCurrencySymbol,
        fnftContractAddress: iaoEvent.FNFTcontractAddress,
        exchangeRate: iaoEvent.exchangeRate,
        iaoEventId,
      };
      await this.dataServices.fractor.updateOne(
        {
          fractorId,
        },
        {
          $push: {
            revenue: newApproveIaoRevenue,
          },
        },
      );
      await session.commitTransaction();
      this.socketGateway.sendMessage(
        SOCKET_EVENT.APPROVE_IAO_REVENUE,
        requestData,
        requestData.metadata.caller,
      );
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  private async _handleRejectIaoRevenueEvent(requestData: WorkerDataDto) {
    const iaoEventId = this.commonService.decodeHexToString(
      requestData.metadata.iaoId,
    );
    const admin = await this.dataServices.admin.findOne({
      walletAddress: {
        $regex: requestData.metadata.caller,
        $options: 'i',
      },
    });
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      await this.dataServices.iaoEvent.updateOne(
        {
          iaoEventId,
          onChainStatus: ON_CHAIN_STATUS.ON_CHAIN,
          isDeleted: false,
          'revenue.status': REVENUE_STATUS.PENDING,
        },
        {
          $set: {
            'revenue.status': REVENUE_STATUS.REJECTED,
            'revenue.finalizedOn': new Date(),
            'revenue.finalizedBy': admin.adminId,
          },
        },
        { session },
      );

      // update asset status
      const iaoEvent = await this.dataServices.iaoEvent.findOne({
        iaoEventId,
      });
      const fnft = await this.dataServices.fnft.findOne({
        contractAddress: iaoEvent.FNFTcontractAddress,
        status: F_NFT_STATUS.ACTIVE,
      });
      if (fnft.fnftType === F_NFT_TYPE.AUTO_IMPORT) {
        const iaoRequest = await this.dataServices.iaoRequest.findOne({
          iaoId: fnft.iaoRequestId,
        });
        await this.dataServices.asset.updateMany(
          { itemId: { $in: iaoRequest.items } },
          {
            $set: {
              status: ASSET_STATUS.FRACTIONALIZED,
              'custodianship.status':
                CUSTODIANSHIP_STATUS.AVAILABLE_FOR_FRACTOR_TO_REDEEM,
            },
          },
          { session },
        );
      }
      //
      await session.commitTransaction();
      this.socketGateway.sendMessage(
        SOCKET_EVENT.REJECT_IAO_REVENUE,
        requestData,
        requestData.metadata.caller,
      );
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  private async _handleFractorClaimEvent(requestData: WorkerDataDto) {
    const listIaoEventId = requestData.metadata.iaoId.map((hexId) =>
      this.commonService.decodeHexToString(hexId),
    );
    const fractorId = this.commonService.decodeHexToString(
      requestData.metadata.fractorId,
    );
    const listIaoEvent = await this.dataServices.iaoEvent.findMany({
      iaoEventId: {
        $in: listIaoEventId,
      },
    });
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      await this.dataServices.withdrawalRequest.findOneAndUpdate(
        {
          status: WITHDRAWAL_REQUEST_STATUS.PROCESSING,
          'revenue.iaoEventId': {
            $in: listIaoEventId,
          },
        },
        {
          status: WITHDRAWAL_REQUEST_STATUS.SUCCESSFUL,
          txHash: requestData.transactionHash,
          transactionCompletedOn: new Date(),
        },
        {
          session,
        },
      );
      listIaoEvent.forEach(async (iaoEvent) => {
        try {
          const tokenInfo = await axios.get(
            `${BASE_COINGECKO_URL}/coins/binance-smart-chain/contract/${iaoEvent.FNFTcontractAddress}/market_chart/?vs_currency=usd&days=0`,
          );
          const tokenUsdPrice = tokenInfo.data.prices[0][1];
          await this.dataServices.fractor.findOneAndUpdate(
            {
              fractorId,
              'revenue.iaoEventId': iaoEvent.iaoEventId,
            },
            {
              'revenue.$.isWithdrawed': true,
              acceptedCurrencyUsdPrice: tokenUsdPrice,
            },
            { session },
          );
        } catch (error) {
          await this.dataServices.fractor.findOneAndUpdate(
            {
              fractorId,
              'revenue.iaoEventId': iaoEvent.iaoEventId,
            },
            {
              'revenue.$.isWithdrawed': true,
              acceptedCurrencyUsdPrice: 1,
            },
            { session },
          );
        }
      });

      session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
