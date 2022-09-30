import { Injectable, Logger } from '@nestjs/common';
import { ApiError } from '../../common/api';
import { CONTRACT_EVENTS, PREFIX_ID } from '../../common/constants';
import { IDataServices } from '../../core/abstracts/data-services.abstract';
import { ADMIN_STATUS } from '../../datalayer/model';
import { Role } from '../../modules/auth/role.enum';
import { SOCKET_EVENT } from '../socket/socket.enum';
import { SocketGateway } from '../socket/socket.gateway';
import { WorkerDataDto } from './dto/worker-data.dto';
import { NFT_STATUS } from 'src/datalayer/model/nft.model';
import { ASSET_STATUS } from 'src/datalayer/model/asset.model';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
const jwt = require('jsonwebtoken');

@Injectable()
export class WorkerService {
  private readonly logger = new Logger(WorkerService.name);

  constructor(
    private readonly dataServices: IDataServices,
    private readonly socketGateway: SocketGateway,
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
      );
    }
  }

  private async _handleMintNFTEvent(requestData: WorkerDataDto) {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      if (requestData.metadata) {
        const nft = await this.dataServices.nft.findOneAndUpdate(
          {
            tokenId: `${PREFIX_ID.NFT}-${requestData.metadata.nftId}`,
          },
          {
            $set: {
              status: NFT_STATUS.MINTED,
              mintingHashTx: requestData.transactionHash,
              mintedAt: new Date(),
              mintedBy: requestData.metadata.mintBy,
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
}
