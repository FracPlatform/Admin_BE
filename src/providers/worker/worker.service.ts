import { Injectable, Logger } from '@nestjs/common';
import { ApiError } from '../../common/api';
import {
  CONTRACT_EVENTS,
  ErrorCode,
  PREFIX_ID,
  TOKEN_STANDARD_BY_ID,
} from '../../common/constants';
import { IDataServices } from '../../core/abstracts/data-services.abstract';
import {
  ADMIN_STATUS,
  F_NFT_MINTED_STATUS,
  F_NFT_STATUS,
  F_NFT_TYPE,
  IAO_EVENT_STATUS,
  IAO_REQUEST_STATUS,
  ON_CHAIN_STATUS,
  PURCHASE_STATUS,
} from '../../datalayer/model';
import { Role } from '../../modules/auth/role.enum';
import { SOCKET_EVENT } from '../socket/socket.enum';
import { SocketGateway } from '../socket/socket.gateway';
import { WorkerDataDto } from './dto/worker-data.dto';
import { NFT_STATUS } from 'src/datalayer/model/nft.model';
import { ASSET_STATUS, REVIEW_STATUS } from 'src/datalayer/model/asset.model';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { CommonService } from 'src/common-service/common.service';
import { DepositedNFT } from 'src/entity';
import axios from 'axios';
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
        case CONTRACT_EVENTS.DEPOSIT_FUND_EVENT:
          await this._handleDepositFundEvent(requestData);
          break;
        default:
          break;
      }
    } catch (err) {
      this.logger.debug(err.message, err.stack);
      throw ApiError('Webhook err', err.message);
    }
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
            updatedBy: admin.fullname,
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
      itemId: `${PREFIX_ID.ASSET}-${requestData.metadata.assetId}`,
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
        this.socketGateway.sendMessage(SOCKET_EVENT.DEPOSIT_NFTS, requestData);
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
    const purchase = await this.dataServices.purchase.findOne({
      _id: purchaseId,
    });
    const iaoEvent = await this.dataServices.iaoEvent.findOne({
      iaoEventId: purchase.iaoEventId,
    });
    const fnft = await this.dataServices.fnft.findOne({
      contractAddress: iaoEvent.FNFTcontractAddress,
    });

    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      // update purchase
      await this.dataServices.purchase.updateOne(
        { _id: purchaseId },
        { status: PURCHASE_STATUS.SUCCESS },
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
}
