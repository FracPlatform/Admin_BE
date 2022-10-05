import { Injectable, Logger } from '@nestjs/common';
import { ApiError } from '../../common/api';
import { CONTRACT_EVENTS, PREFIX_ID } from '../../common/constants';
import { IDataServices } from '../../core/abstracts/data-services.abstract';
import {
  ADMIN_STATUS,
  F_NFT_MINTED_STATUS,
  F_NFT_STATUS,
  F_NFT_TYPE,
  IAO_EVENT_STATUS,
  ON_CHAIN_STATUS,
} from '../../datalayer/model';
import { Role } from '../../modules/auth/role.enum';
import { SOCKET_EVENT } from '../socket/socket.enum';
import { SocketGateway } from '../socket/socket.gateway';
import { WorkerDataDto } from './dto/worker-data.dto';
import { NFT_STATUS } from 'src/datalayer/model/nft.model';
import { ASSET_STATUS } from 'src/datalayer/model/asset.model';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { CommonService } from 'src/common-service/common.service';
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
        { walletAddress: requestData.metadata.addr },
        {
          status: ADMIN_STATUS.INACTIVE,
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
        { walletAddress: requestData.metadata.addr },
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
    /**
     * Update mintedStatus of f-nft in db to 1(MINTED)
     *   contract address, fractionalized by, fractionalized on, tx hash
     * Update status nft to 3(FRACTIONLIZED)
     * Update status asset item to 5(FRACTIONALIZED)
     */

    const admin = await this.dataServices.admin.findOne({
      walletAddress: requestData.metadata.mintBy,
    });

    await this.dataServices.fnft.findOneAndUpdate(
      { fnftId: requestData.metadata.fnftId },
      {
        mintedStatus: F_NFT_MINTED_STATUS.MINTED,
        contractAddress: requestData.metadata.fracTokenAddr,
        fractionalizedBy: admin.adminId,
        fractionalizedOn: new Date(),
        txhash: requestData.transactionHash,
      },
    );

    this.socketGateway.sendMessage(SOCKET_EVENT.MINT_F_NFT_EVENT, requestData);
  }

  private async _handleCreateIaoEventOnChain(requestData: WorkerDataDto) {
    const admin = await this.dataServices.admin.findOne({
      walletAddress: requestData.metadata.createdBy,
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
      );
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
