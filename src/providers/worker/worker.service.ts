import { NFT_WITHDRAWAL_REQUEST_STATUS } from './../../datalayer/model/nft-withdrawal-request.model';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ApiError } from '../../common/api';
import {
  CONTRACT_EVENTS,
  ErrorCode,
  LOCALIZATION,
  MIMEType,
  PREFIX_ID,
  QUEUE,
  QUEUE_SETTINGS,
  SPOT_DEX_URL,
  TOKEN_STANDARD_BY_ID,
  WithdrawType,
} from '../../common/constants';
import { IDataServices } from '../../core/abstracts/data-services.abstract';
import {
  ADMIN_STATUS,
  CategoryType,
  CLAIM_STATUS,
  CLAIM_TYPE,
  FractorRevenue,
  F_NFT_MINTED_STATUS,
  F_NFT_STATUS,
  F_NFT_TYPE,
  IAO_EVENT_STATUS,
  IAO_REQUEST_STATUS,
  NOTIFICATION_SUBTYPE,
  NOTIFICATION_TYPE,
  ON_CHAIN_STATUS,
  PURCHASE_STATUS,
  REVENUE_SOURCE,
  REVENUE_STATUS,
  WITHDRAWAL_REQUEST_STATUS,
  KYCStatus,
  AFFILIATE_WITHDRAWAL_REQUEST_STATUS,
  Purchase,
  FiatPurchase,
  FIAT_PURCHASE_STATUS,
  Fractor,
  PURCHASE_TYPE,
} from '../../datalayer/model';
import { Role } from '../../modules/auth/role.enum';
import {
  SOCKET_EVENT,
  SOCKET_NAMESPACE,
  SOCKET_NOTIFICATION_EVENT,
} from '../socket/socket.enum';
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
import { MailService } from 'src/services/mail/mail.service';
import { Utils } from 'src/common/utils';
import { WorkerFactoryService } from './worker-factory.service';
import { EmailService, Mail } from 'src/services/email/email.service';
import { EMAIL_CONFIG } from 'src/common/email-config';
import { SentNotificationTask } from '../schedule/sent-notification.task';
import { IaoRequestBuilderService } from 'src/modules/iao-request/iao-request.factory.service';
import { TieringPoolService } from 'src/modules/tiering-pool/tiering-pool.service';
import { CreateTieringPoolDto } from 'src/modules/tiering-pool/dto/tiering-pool.dto';
import { StakingHistoryService } from 'src/modules/staking-history/staking-history.service';
import { StakingInfoDto } from 'src/modules/staking-history/dto/staking-history.dto';
import { EventKYC, StatusKyc } from './dto/kyc.dto';
import { NotificationForDexEntity } from '../../entity/notification.entity';
const jwt = require('jsonwebtoken');
const FormData = require('form-data');
const crypto = require('crypto');
const Queue = require('bee-queue');
import { IpfsGateway } from '../ipfs/ipfs.gateway';
import { IpfsClientType } from '../ipfs/ipfs.type';
import { NftMetadataEntity } from 'src/entity/nft.entity';
import { S3Service } from 'src/s3/s3.service';

enum REVENUE_TYPE {
  CRYPTO = 'CRYPTO',
  FIAT = 'FIAT',
}

@Injectable()
export class WorkerService implements OnModuleInit {
  private readonly logger = new Logger(WorkerService.name);
  private readonly uploadIpfsAssetQueue = new Queue(
    QUEUE.UPLOAD_IPFS_ASSET,
    QUEUE_SETTINGS,
  );

  constructor(
    private readonly dataServices: IDataServices,
    private readonly socketGateway: SocketGateway,
    private readonly commonService: CommonService,
    private readonly mailService: MailService,
    private readonly emailService: EmailService,
    private readonly workerBuilder: WorkerFactoryService,
    private readonly sendNotificationTask: SentNotificationTask,
    private readonly iaoRequestBuilderService: IaoRequestBuilderService,
    private readonly tieringPoolService: TieringPoolService,
    private readonly stakingHistoryService: StakingHistoryService,
    private readonly s3Service: S3Service,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async onModuleInit() {
    await this.initUploadIPFSAssetQueue();
  }

  async initUploadIPFSAssetQueue() {
    this.uploadIpfsAssetQueue.checkStalledJobs(5000, (err, numStalled) => {
      if (err) {
        this.logger.error(
          `initUploadIPFSAssetQueue(): Error check checkStalledJobs`,
          err,
        );
      }
      if (numStalled > 0) {
        this.logger.log(
          `initUploadIPFSAssetQueue(): Checked stalled jobs = ${numStalled}`,
        );
      }
    });

    this.uploadIpfsAssetQueue.on('ready', () => {
      console.log(
        'initUploadIPFSAssetQueue(): Upload IPFS Asset Queue is ready',
      );
    });
    this.uploadIpfsAssetQueue.process(async (job) => {
      try {
        const assetId = job.data;
        console.log(
          `initUploadIPFSAssetQueue(): Upload IPFS Asset ID ${assetId}`,
        );
        // return this._uploadIpfsAsset(assetId);
      } catch (error) {
        return Promise.reject(error);
      }
    });
    this.uploadIpfsAssetQueue.on('failed', async (job, err) => {
      this.logger.error(
        `initUploadIPFSAssetQueue(): Job ${job.id} error failed: ${err.message}`,
      );
    });
    this.uploadIpfsAssetQueue.on('succeeded', async (job, result) => {
      this.logger.log(
        `initUploadIPFSAssetQueue(): Job ${job.id} succeeded with result: ${result}`,
      );
    });
  }

  async addUploadIpfsAssetQueue(assetId: string) {
    await this.uploadIpfsAssetQueue
      .createJob(assetId)
      .setId(assetId)
      .backoff('fixed', 5000)
      .retries(Number.MAX_SAFE_INTEGER)
      .save();
  }

  async generateToken() {
    const payload = { address: 'Worker', role: '' };
    const token = jwt.sign(payload, process.env.JWT_SECRET);
    return { token };
  }

  async submitKyc(request: Request, dataKyc: EventKYC) {
    try {
      const body = request.body;
      const signature = request.headers['x-hub-signature'];
      const hash = crypto
        .createHmac('sha256', process.env.BLOCK_PASS_SECRET_KEY)
        .update(JSON.stringify(body))
        .digest('hex');

      if (!signature || signature !== hash)
        throw ApiError(
          ErrorCode.DEFAULT_ERROR,
          'Access denied: Incorrect signature !',
        );

      const fractor = await this.dataServices.fractor.findOne({
        fractorId: dataKyc.refId,
      });
      if (!fractor)
        throw ApiError(ErrorCode.DEFAULT_ERROR, 'Cannot found fractor');

      const updateObj = {};

      switch (dataKyc.status) {
        case StatusKyc.INCOMPLETE:
          updateObj['kycStatus'] = KYCStatus.INCOMPLETE;
          break;
        case StatusKyc.WAITING:
          updateObj['kycStatus'] = KYCStatus.WAITING;
          break;
        case StatusKyc.APPROVED:
          updateObj['kycStatus'] = KYCStatus.APPROVED;
          break;
        case StatusKyc.INREVIEW:
          updateObj['kycStatus'] = KYCStatus.INREVIEW;
          break;
        default:
          updateObj['kycStatus'] = KYCStatus.REJECTED;
          break;
      }

      await this.dataServices.fractor.findOneAndUpdate(
        { _id: fractor['_id'] },
        updateObj,
      );

      return { success: true };
    } catch (e) {
      throw e;
    }
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
        case CONTRACT_EVENTS.REDEEM_NFT_EVENT:
          await this._handleRedeemNFTEvent(requestData);
          break;
        case CONTRACT_EVENTS.SENT_USER_FEE_SYSTEM:
          await this._handleTraderWithdrawal(requestData);
          break;
        case CONTRACT_EVENTS.CREATE_TIER_POOL_EVENT:
          await this._handleCreateTieringPool(requestData);
          break;
        case CONTRACT_EVENTS.UN_STAKE_EVENT:
          await this._handleUnstake(requestData);
          break;
        case CONTRACT_EVENTS.STAKE_EVENT:
          await this._handleStake(requestData);
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
    let assetId;
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
          assetId = nft.assetId;
        }
        await session.commitTransaction();
        this.socketGateway.sendMessage(
          SOCKET_EVENT.MINT_NFT_EVENT,
          requestData,
          requestData.metadata.mintBy,
        );
      }
    } catch (error) {
      this.logger.error(error);
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

    // Upload ipfs asset
    if (assetId) {
      await this.addUploadIpfsAssetQueue(assetId);
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
        { $set: { status: NFT_STATUS.FRACTIONALIZED } },
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
      this.logger.error(error);
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
      // 15/02: mark nft is in iao event minted
      await this.dataServices.nft.updateMany(
        {
          tokenId: { $in: fnft.items },
        },
        {
          $set: {
            inIaoEventOnChain: true,
          },
        },
      );

      await session.commitTransaction();
      this.socketGateway.sendMessage(
        SOCKET_EVENT.CREATE_IAO_EVENT_ON_CHAIN,
        requestData,
        requestData.metadata.createdBy,
      );
    } catch (error) {
      this.logger.error(error);
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
      this.logger.error(error);
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
            'revenue.status': REVENUE_STATUS.CLOSED,
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
          {
            $and: [
              { $or: items },
              { category: 'virtual' },
              { isMintNFT: true },
            ],
          },
          {
            $set: {
              status: ASSET_STATUS.OPEN,
              'custodianship.status':
                CUSTODIANSHIP_STATUS.AVAILABLE_FOR_FRACTOR_TO_REDEEM,
            },
          },
          { session },
        );

        await this.dataServices.asset.updateMany(
          {
            $and: [{ $or: items }, { isMintNFT: false }],
          },
          {
            $set: {
              status: ASSET_STATUS.OPEN,
              'custodianship.status': CUSTODIANSHIP_STATUS.FRACTOR,
            },
          },
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
      this.logger.error(error);
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
      let metadata: any;
      let finalUri: string = requestData?.metadata?.uri;
      if (finalUri.includes('0x{id}'))
        finalUri = `${finalUri.replace(
          '0x{id}',
          requestData.metadata.tokenId,
        )}?format=json`;
      if (finalUri.includes('ipfs://'))
        finalUri = finalUri.replace('ipfs://', 'https://ipfs.io/ipfs/');
      try {
        const { data } = await axios.get(finalUri);
        metadata = data;
      } catch (error) {
        this.logger.error('Can not get NFT metadata');
      }
      const depositedNFT: DepositedNFT = {
        contractAddress: requestData.metadata.nftAddr,
        tokenId: requestData.metadata.tokenId,
        balance: parseInt(requestData.metadata.tokenAmount),
        depositedOn: new Date(),
        status: REVIEW_STATUS.IN_REVIEW,
        tokenStandard: TOKEN_STANDARD_BY_ID[requestData.metadata.tokenType],
        txHash: requestData.transactionHash,
        withdrawable: 0,
        chainId: requestData.chainId,
        metadata: {
          name: metadata?.name || '',
          image:
            metadata?.image?.replace('ipfs://', 'https://ipfs.io/ipfs/') || '',
          animation_url: metadata?.animation_url || '',
        },
      };
      const res = await this.dataServices.asset.findOneAndUpdate(
        {
          itemId: requestData.metadata.assetId,
        },
        {
          $push: { 'custodianship.depositedNFTs': depositedNFT },
        },
        { session },
      );
      await session.commitTransaction();
      if (res)
        this.socketGateway.sendMessage(
          SOCKET_EVENT.DEPOSIT_NFTS,
          requestData,
          requestData.metadata.sender,
        );
    } catch (error) {
      this.logger.error(error);
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

    let isPurchasedCrypto = true;
    let purchase: any = await this.dataServices.purchase.findOne({
      _id: purchaseId,
      transactionHash: { $ne: transactionHash },
    });

    if (!purchase) {
      isPurchasedCrypto = false;
      purchase = await this.dataServices.fiatPurchase.findOne({
        _id: purchaseId,
        transactionHash: { $ne: transactionHash },
      });
      if (!purchase) {
        this.logger.debug('Purchase not found: ', purchaseId, transactionHash);
        return;
      }
    }

    let iaoEvent = await this.dataServices.iaoEvent.findOne({
      iaoEventId: purchase.iaoEventId,
    });

    if (!iaoEvent) {
      this.logger.debug(
        'Invalid IAO event: ',
        purchase.iaoEventId,
        transactionHash,
      );
      return;
    }

    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      // update purchase
      if (isPurchasedCrypto) {
        this.logger.debug('Purchase', purchase);
        await this.dataServices.purchase.updateOne(
          { _id: purchaseId },
          { status: PURCHASE_STATUS.SUCCESS, transactionHash },
          { session },
        );
      }
      if (!isPurchasedCrypto) {
        this.logger.debug('FiatPurchase', purchase);
        await this.dataServices.fiatPurchase.updateOne(
          { _id: purchaseId },
          { status: FIAT_PURCHASE_STATUS.SUCCESSFUL, transactionHash, isMint: true },
          { session },
        );
      }

      // update iao event
      iaoEvent = await this.dataServices.iaoEvent.findOneAndUpdate(
        {
          iaoEventId: purchase.iaoEventId,
          availableSupply: { $gte: purchase.tokenAmount },
        },
        {
          availableSupply: new BigNumber(iaoEvent.availableSupply).minus(
            new BigNumber(purchase.tokenAmount),
          ),
        },
        { session, new: true },
      );

      // update FNFT
      await this.dataServices.fnft.updateOne(
        {
          contractAddress: iaoEvent.FNFTcontractAddress,
          availableSupply: { $gte: purchase.tokenAmount },
        },
        {
          availableSupply: new BigNumber(iaoEvent.availableSupply).minus(
            new BigNumber(purchase.tokenAmount),
          ),
        },
        { session },
      );

      // whitelist
      const wl = await this.dataServices.whitelist.findOne({
        iaoEventId: purchase.iaoEventId,
        deleted: false,
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
      if (+requestData.metadata.fund > 0) {
        this.socketGateway.sendMessage(
          SOCKET_EVENT.DEPOSIT_FUND_EVENT,
          requestData,
          requestData.metadata.buyer,
        );
      }
    } catch (error) {
      this.logger.error(error);
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
      const listOwnedAssetId = listOwnedNfts.map((nft) => nft.assetId);
      const listOwnedAssets = await this.dataServices.asset.findMany({
        itemId: {
          $in: listOwnedAssetId,
        },
      });
      await Promise.all(
        listOwnedAssets.map(async (asset) => {
          if (
            asset.category === CategoryType.PHYSICAL ||
            (asset.category === CategoryType.VIRTUAL && asset.isMintNFT)
          ) {
            await this.dataServices.asset.updateOne(
              {
                itemId: asset.itemId,
              },
              {
                $set: {
                  'custodianship.status':
                    CUSTODIANSHIP_STATUS.AVAILABLE_FOR_USER_TO_REDEEM,
                },
              },
              { session },
            );
          } else {
            await this.dataServices.asset.updateOne(
              {
                itemId: asset.itemId,
              },
              {
                $set: {
                  'custodianship.status': CUSTODIANSHIP_STATUS.USER,
                },
              },
              { session },
            );
          }
        }),
      );

      const currentFnft = await this.dataServices.fnft.findOne({
        contractAddress: requestData.metadata.tokenAddr,
      });

      const currentUser = await this.dataServices.user.findOne({
        walletAddress: requestData.metadata.receiver,
      });

      // notification
      const { listNewNotification, listMail } = await this.createNotifications(
        session,
        currentFnft,
        currentUser,
      );

      await session.commitTransaction();
      this.socketGateway.sendMessage(
        SOCKET_EVENT.MERGE_FNFT_EVENT,
        requestData,
        requestData.metadata.receiver,
      );

      // send socket & mail
      listNewNotification.length &&
        listMail.length &&
        this._sendSocketAndMail(
          currentUser,
          currentFnft,
          listMail,
          listNewNotification,
        );
    } catch (error) {
      this.logger.error(error);
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async createNotifications(session, currentFnft, currentUser) {
    if (!currentFnft || !currentUser)
      return { listNewNotification: [], listMail: [] };

    const listMail = [];
    const newNotifications = [];

    const listAdmin = await this.dataServices.admin.findMany({
      role: {
        $in: [Role.SuperAdmin, Role.OperationAdmin, Role.OWNER],
      },
      status: ADMIN_STATUS.ACTIVE,
      deleted: false,
    });

    listAdmin.forEach((a) => {
      newNotifications.push({
        type: NOTIFICATION_TYPE.ANNOUNCEMENT,
        receiver: a.adminId,
        subtype: NOTIFICATION_SUBTYPE.FNFT_MERGED,
        extraData: {
          tokenName: currentFnft.tokenName,
          tokenSymbol: currentFnft.tokenSymbol,
          fnftId: currentFnft.fnftId,
          walletAddress: currentUser.walletAddress,
          userId: currentUser.userId,
        },
        read: false,
        deleted: false,
        hided: false,
        dexId: null,
      });
      if (a.email) listMail.push(a.email);
    });
    if (!newNotifications.length) return { listNewNotification: [], listMail };

    const listNewNotification = await this.dataServices.notification.insertMany(
      newNotifications,
      { session },
    );

    return { listNewNotification, listMail };
  }

  _sendSocketAndMail(
    user: any,
    fnft: any,
    listMail: string[],
    listNewNotification: any,
  ) {
    //socket
    const adminIds = listNewNotification.map((noti) => noti.receiver);

    this.socketGateway.sendNotification(
      SOCKET_NAMESPACE.ADMIN_ANNOUNCEMENT,
      SOCKET_NOTIFICATION_EVENT.FNFT_MERGED_EVENT,
      adminIds,
      {
        fnftId: listNewNotification[0].extraData.fnftId,
        tokenName: listNewNotification[0].extraData.tokenName,
        tokenSymbol: listNewNotification[0].extraData.tokenSymbol,
        userId: listNewNotification[0].extraData.userId,
        walletAddress: listNewNotification[0].extraData.walletAddress,
        subtype: listNewNotification[0].subtype,
      },
    );

    //mail
    this.mailService.sendMailFnftMergedToAdmin(listMail, {
      tokenName: fnft.tokenName,
      tokenSymbol: fnft.tokenSymbol,
      fnftId: fnft.fnftId,
      walletAddress: user.walletAddress,
      userId: user.userId,
    });
  }

  private async _handleApproveIaoRevenueEvent(requestData: WorkerDataDto) {
    const iaoEventId = this.commonService.decodeHexToString(
      requestData.metadata.iaoId,
    );
    const fractorId = this.commonService.decodeHexToString(
      requestData.metadata.fractorId,
    );
    let iaoEvent = await this.dataServices.iaoEvent.findOne({
      iaoEventId,
    });
    if (!iaoEvent) {
      this.logger.debug(
        'Invalid iaoEvent: ',
        iaoEventId,
        requestData.metadata.transactionHash,
      );
      return;
    }
    const admin = await this.dataServices.admin.findOne({
      walletAddress: {
        $regex: requestData.metadata.caller,
        $options: 'i',
      },
    });
    if (!admin) {
      this.logger.debug(
        'Invalid Admin: ',
        requestData.metadata.caller,
        requestData.metadata.transactionHash,
      );
      return;
    }
    const bdCommissionRate = requestData.metadata.bdRate / Math.pow(10, 2);
    const platformCommissionRate =
      requestData.metadata.platformRate / Math.pow(10, 2);
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      iaoEvent = await this.dataServices.iaoEvent.findOneAndUpdate(
        {
          iaoEventId,
        },
        {
          $set: {
            'revenue.status': REVENUE_STATUS.APPROVED,
            'revenue.finalizedOn': new Date(),
            'revenue.finalizedBy': admin.adminId,
            'revenue.bdCommissionRate': bdCommissionRate,
            'revenue.platformCommissionRate': platformCommissionRate,
          },
        },
        {
          session,
          new: true,
        },
      );

      const dataCurrency = await this.dataServices.exchangeRate.findOne(
        {
          contractAddress: Utils.queryInsensitive(
            iaoEvent.acceptedCurrencyAddress,
          ),
        },
        { _id: 0, contractAddress: 1, exchangeRate: 1 },
      );
      const tokenUsdPrice = dataCurrency?.exchangeRate || 0;

      const fractor = await this.dataServices.fractor.findOne({
        fractorId: fractorId,
      });

      // update fractor revenue
      await this.updateFractorRevenue(
        fractor,
        fractor.revenue,
        session,
        requestData,
        iaoEvent,
        tokenUsdPrice,
        REVENUE_TYPE.CRYPTO,
      );
      // update fractor revenue fiat
      await this.updateFractorRevenue(
        fractor,
        fractor.revenueFiat,
        session,
        requestData,
        iaoEvent,
        tokenUsdPrice,
        REVENUE_TYPE.FIAT,
      );
      // add coin to dex
      await this._callApiAddCoinToDex(iaoEvent.FNFTcontractAddress);

      await session.commitTransaction();

      this.socketGateway.sendMessage(
        SOCKET_EVENT.APPROVE_IAO_REVENUE,
        requestData,
        requestData.metadata.caller,
      );

      if (fractor.notificationSettings?.iaoEventResult)
        await this.sendNotificationWhenApproveRevenueForFractor(iaoEvent);
      //
    } catch (error) {
      this.logger.error(error);
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async updateFractorRevenue(
    fractor: Fractor,
    fractorRevenue: FractorRevenue[],
    session: any,
    requestData: any,
    iaoEvent: any,
    tokenUsdPrice: any,
    type: string,
  ) {
    const existRevenueWithdrawed = fractorRevenue.find(
      (e) => !e.isWithdrawed && e.iaoEventId === iaoEvent.iaoEventId,
    );
    // update revenue
    if (existRevenueWithdrawed) {
      const revenueCondition = {
        fractorId: fractor.fractorId,
      };
      let revenueUpdate = {};
      if (type === REVENUE_TYPE.FIAT) {
        revenueCondition['revenueFiat'] = {
          $elemMatch: {
            $and: [
              { iaoEventId: iaoEvent.iaoEventId },
              { isWithdrawed: false },
            ],
          },
        };
        const balance = new BigNumber(iaoEvent.participatedByFiatAmount)
          .multipliedBy(
            1 - (iaoEvent?.revenue?.platformComissionRate || 0) / 100,
          )
          .toNumber();
        revenueUpdate = {
          $inc: {
            'revenueFiat.$.balance': balance,
          },
        };
      }
      if (type === REVENUE_TYPE.CRYPTO) {
        revenueCondition['revenue'] = {
          $elemMatch: {
            $and: [
              { iaoEventId: iaoEvent.iaoEventId },
              { isWithdrawed: false },
            ],
          },
        };
        revenueUpdate = {
          $inc: {
            'revenue.$.balance': new BigNumber(requestData.metadata.revenue)
              .dividedBy(Math.pow(10, iaoEvent.currencyDecimal))
              .toNumber(),
          },
        };
      }
      await this.dataServices.fractor.findOneAndUpdate(
        revenueCondition,
        revenueUpdate,
        { session, new: true },
      );
      return;
    }

    // create new revenue
    let balance = new BigNumber(requestData.metadata.revenue)
      .dividedBy(Math.pow(10, iaoEvent.currencyDecimal))
      .toNumber();
    let exchangeRate = iaoEvent.exchangeRate;

    let symbol = iaoEvent.acceptedCurrencySymbol;
    if (type === REVENUE_TYPE.FIAT) {
      balance = new BigNumber(iaoEvent.participatedByFiatAmount)
        .multipliedBy(1 - (iaoEvent?.revenue?.platformComissionRate || 0) / 100)
        .toNumber();
      exchangeRate = iaoEvent.nftPriceSgd;
      symbol = iaoEvent.fiatSymbol;
    }
    const newApproveIaoRevenue: FractorRevenue = {
      isWithdrawed: false,
      balance,
      currencyContract: iaoEvent.acceptedCurrencyAddress,
      approveAcceptedCurrencyUsdPrice: tokenUsdPrice,
      acceptedCurrencySymbol: symbol,
      fnftContractAddress: iaoEvent.FNFTcontractAddress,
      exchangeRate,
      iaoEventId: iaoEvent.iaoEventId,
    };
    const newRevenue = {};
    if (type === REVENUE_TYPE.FIAT) {
      newRevenue['revenueFiat'] = newApproveIaoRevenue;
    }
    if (type === REVENUE_TYPE.CRYPTO) {
      newRevenue['revenue'] = newApproveIaoRevenue;
    }
    await this.dataServices.fractor.updateOne(
      {
        fractorId: fractor.fractorId,
      },
      {
        $push: newRevenue,
      },
      { session },
    );
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
    const iaoEvent = await this.dataServices.iaoEvent.findOne({ iaoEventId });

    const fractor = await this.dataServices.fractor.findOne({
      fractorId: iaoEvent.fractorId,
    });

    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      await this.dataServices.iaoEvent.updateOne(
        {
          iaoEventId,
          onChainStatus: ON_CHAIN_STATUS.ON_CHAIN,
          isDeleted: false,
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
      const insertedNotifications =
        await this.sendNotificationTask.sendIaoRevenueRejectedNotification(
          iaoEventId,
          session,
        );
      // send mail and notification

      await session.commitTransaction();
      if (insertedNotifications) {
        await this.sendNotificationTask.sendNotificationForDex(
          insertedNotifications,
        );
      }

      this.socketGateway.sendMessage(
        SOCKET_EVENT.REJECT_IAO_REVENUE,
        requestData,
        requestData.metadata.caller,
      );

      if (fractor.notificationSettings?.iaoEventResult)
        await this.sendNotificationWhenRejectRevenueForFractor(iaoEvent);
    } catch (error) {
      this.logger.error(error);
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async sendNotificationWhenApproveRevenueForFractor(iaoEvent) {
    const fractor = await this.dataServices.fractor.findOne({
      fractorId: iaoEvent.fractorId,
    });
    const notification =
      this.iaoRequestBuilderService.createNotificationForApprovedRevenue(
        iaoEvent.fractorId,
        iaoEvent.iaoEventName,
        NOTIFICATION_SUBTYPE.APPROVE_IAO_REVENUE,
        iaoEvent.iaoEventId,
      );
    const data = await this.dataServices.notification.create(notification);
    this.socketGateway.sendNotification(
      SOCKET_NAMESPACE.IAO_EVENT_RESULT,
      `${SOCKET_NOTIFICATION_EVENT.ADMIN_APPROVED_IAO_REVENUE_EVENT}_${iaoEvent.fractorId}`,
      data[0],
    );
    if (fractor.email) {
      const data = this.createTemplateApprovedRevenue(
        fractor.email,
        iaoEvent.iaoEventName,
        fractor.localization,
        iaoEvent.iaoEventId,
      );
      await this.emailService.addQueue(data);
    }
  }

  createTemplateApprovedRevenue(email, eventName, localization, iaoeventId) {
    let template = EMAIL_CONFIG.DIR.APPROVED_IAO_REVENUE.EN;
    let subject = EMAIL_CONFIG.TITLE.APPROVED_IAO_REVENUE.EN;
    let iaoEventName = eventName.en;
    const myRevenueUrl = `${process.env.FRACTOR_DOMAIN}/my-revenue`;
    const eventDetailUrl = `${process.env.TRADER_DOMAIN}/iao-event/${iaoeventId}`;

    if (localization === LOCALIZATION.CN) {
      template = EMAIL_CONFIG.DIR.APPROVED_IAO_REVENUE.CN;
      subject = EMAIL_CONFIG.TITLE.APPROVED_IAO_REVENUE.CN;
      iaoEventName = eventName.cn || eventName.en;
    }
    if (localization === LOCALIZATION.JP) {
      template = EMAIL_CONFIG.DIR.APPROVED_IAO_REVENUE.JA;
      subject = EMAIL_CONFIG.TITLE.APPROVED_IAO_REVENUE.JP;
      iaoEventName = eventName.jp || eventName.en;
    }
    if (localization === LOCALIZATION.VN) {
      template = EMAIL_CONFIG.DIR.APPROVED_IAO_REVENUE.VI;
      subject = EMAIL_CONFIG.TITLE.APPROVED_IAO_REVENUE.VN;
      iaoEventName = eventName.vn || eventName.en;
    }

    return {
      to: email,
      from: { name: EMAIL_CONFIG.FROM_EMAIL, address: process.env.MAIL_FROM },
      subject,
      template,
      context: {
        eventName: iaoEventName,
        myRevenueUrl,
        eventDetailUrl,
        contactUs: `${process.env.FRACTOR_DOMAIN}/${localization}/contact-us`,
      },
    };
  }

  createTemplateRejectIAORevenue(email, eventName, iaoeventId, localization) {
    let template = EMAIL_CONFIG.DIR.REJECT_IAO_REVENUE.EN;
    let subject = EMAIL_CONFIG.TITLE.REJECT_IAO_REVENUE.EN;
    let iaoEventName = eventName.en;
    const eventDetailUrl = `${process.env.TRADER_DOMAIN}/${localization}/iao-event/${iaoeventId}`;

    if (localization === LOCALIZATION.CN) {
      template = EMAIL_CONFIG.DIR.REJECT_IAO_REVENUE.CN;
      subject = EMAIL_CONFIG.TITLE.REJECT_IAO_REVENUE.CN;
      iaoEventName = eventName.cn || eventName.en;
    }
    if (localization === LOCALIZATION.JP) {
      template = EMAIL_CONFIG.DIR.REJECT_IAO_REVENUE.JA;
      subject = EMAIL_CONFIG.TITLE.REJECT_IAO_REVENUE.JP;
      iaoEventName = eventName.jp || eventName.en;
    }
    if (localization === LOCALIZATION.VN) {
      template = EMAIL_CONFIG.DIR.REJECT_IAO_REVENUE.VI;
      subject = EMAIL_CONFIG.TITLE.REJECT_IAO_REVENUE.VN;
      iaoEventName = eventName.vn || eventName.en;
    }

    return {
      to: email,
      from: { name: EMAIL_CONFIG.FROM_EMAIL, address: process.env.MAIL_FROM },
      subject,
      template,
      context: {
        eventName: iaoEventName,
        eventDetailUrl,
        contactUs: `${process.env.FRACTOR_DOMAIN}/${localization}/contact-us`,
        localization: localization,
      },
    };
  }

  async sendNotificationWhenRejectRevenueForFractor(iaoEvent) {
    const fractor = await this.dataServices.fractor.findOne({
      fractorId: iaoEvent.fractorId,
    });
    const notification =
      this.iaoRequestBuilderService.createNotificationForApprovedRevenue(
        iaoEvent.fractorId,
        iaoEvent.iaoEventName,
        NOTIFICATION_SUBTYPE.REJECT_IAO_REVENUE,
        iaoEvent.iaoEventId,
      );
    const data = await this.dataServices.notification.create(notification);
    this.socketGateway.sendNotification(
      SOCKET_NAMESPACE.IAO_EVENT_RESULT,
      `${SOCKET_NOTIFICATION_EVENT.ADMIN_REJECT_IAO_REVENUE_EVENT}_${iaoEvent.fractorId}`,
      data[0],
    );
    if (fractor.email) {
      const data = this.createTemplateRejectIAORevenue(
        fractor.email,
        iaoEvent.iaoEventName,
        iaoEvent.iaoEventId,
        fractor.localization,
      );
      await this.emailService.addQueue(data);
    }
  }

  async sendNotificationWhenWithdrawSuccessForFractor(
    fractor,
    withdrawRequestId,
    recipientAddress,
  ) {
    const notification =
      this.iaoRequestBuilderService.createNotificationForWithdrawSuccess(
        fractor.fractorId,
        withdrawRequestId,
        recipientAddress,
        NOTIFICATION_SUBTYPE.WITHDRAWAL_REQUEST_SUCCEEDED,
      );
    const data = await this.dataServices.notification.create(notification);
    this.socketGateway.sendNotification(
      SOCKET_NAMESPACE.REVENUE_WITHDRAWAL,
      `${SOCKET_NOTIFICATION_EVENT.FRACTOR_WITHDRAWAL_REQUEST_SUCCESSFULLY}_${fractor.fractorId}`,
      data[0],
    );
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
    const request = await this.dataServices.withdrawalRequest.findOne({
      status: WITHDRAWAL_REQUEST_STATUS.PROCESSING,
      createdBy: fractorId,
      revenueSource: REVENUE_SOURCE.IAO,
      recipientAddress: {
        $regex: requestData.metadata.receiver,
        $options: 'i',
      },
    });
    if (request) {
      const fractor = await this.dataServices.fractor.findOne({
        fractorId,
      });
      const session = await this.connection.startSession();
      session.startTransaction();
      try {
        await this.dataServices.withdrawalRequest.findOneAndUpdate(
          {
            status: WITHDRAWAL_REQUEST_STATUS.PROCESSING,
            createdBy: fractorId,
            revenueSource: REVENUE_SOURCE.IAO,
            recipientAddress: {
              $regex: requestData.metadata.receiver,
              $options: 'i',
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
        await Promise.all(
          listIaoEvent.map(async (iaoEvent) => {
            try {
              const dataCurrency = await this.dataServices.exchangeRate.findOne(
                {
                  contractAddress: Utils.queryInsensitive(
                    iaoEvent.acceptedCurrencyAddress,
                  ),
                },
                { _id: 0, contractAddress: 1, exchangeRate: 1 },
              );
              const tokenUsdPrice = dataCurrency?.exchangeRate || 0;

              await this.dataServices.fractor.findOneAndUpdate(
                {
                  fractorId,
                  'revenue.iaoEventId': iaoEvent.iaoEventId,
                },
                {
                  $set: {
                    'revenue.$.isWithdrawed': true,
                    'revenue.$.acceptedCurrencyUsdPrice': tokenUsdPrice,
                  },
                },
                { session },
              );
              await this.dataServices.withdrawalRequest.findOneAndUpdate(
                {
                  'revenue.iaoEventId': iaoEvent.iaoEventId,
                },
                {
                  $set: {
                    'revenue.$.acceptedCurrencyUsdPrice': tokenUsdPrice,
                  },
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
                  $set: {
                    'revenue.$.isWithdrawed': true,
                    'revenue.$.acceptedCurrencyUsdPrice': 0,
                  },
                },
                { session },
              );
              await this.dataServices.withdrawalRequest.findOneAndUpdate(
                {
                  'revenue.iaoEventId': iaoEvent.iaoEventId,
                },
                {
                  $set: {
                    'revenue.$.acceptedCurrencyUsdPrice': 0,
                  },
                },
                { session },
              );
            }
          }),
        );

        await session.commitTransaction();

        let title = EMAIL_CONFIG.TITLE.WITHDRAWAL_REQUEST_SUCCEEDED.EN;
        let template = EMAIL_CONFIG.TEMPLATE.WITHDRAWAL_REQUEST.EN;
        if (fractor.localization === LOCALIZATION.CN) {
          title = EMAIL_CONFIG.TITLE.WITHDRAWAL_REQUEST_SUCCEEDED.CN;
          template = EMAIL_CONFIG.TEMPLATE.WITHDRAWAL_REQUEST.CN;
        }
        if (fractor.localization === LOCALIZATION.JP) {
          title = EMAIL_CONFIG.TITLE.WITHDRAWAL_REQUEST_SUCCEEDED.JP;
          template = EMAIL_CONFIG.TEMPLATE.WITHDRAWAL_REQUEST.JP;
        }
        if (fractor.localization === LOCALIZATION.VN) {
          title = EMAIL_CONFIG.TITLE.WITHDRAWAL_REQUEST_SUCCEEDED.VN;
          template = EMAIL_CONFIG.TEMPLATE.WITHDRAWAL_REQUEST.VN;
        }

        const context = {
          requestId: request.requestId,
          recipientName: fractor.fullname || '',
          recipientWalletAddress: request.recipientAddress,
          email: fractor.email,
          txHash: requestData.transactionHash,
          fractorDomain: process.env.FRACTOR_DOMAIN,
          adminDomain: process.env.ADMIN_DOMAIN,
          traderDomain: process.env.TRADER_DOMAIN,
          landingPage: process.env.LANDING_PAGE,
          dexDomain: process.env.DEX_DOMAIN,
          contactUs: `${process.env.TRADER_DOMAIN}/${fractor.localization}/contact-us`,
          bscDomain: process.env.BSC_SCAN_DOMAIN,
          localization: fractor.localization,
          proofUrl: request.proofUrl,
          isCrypto: request.requestType === PURCHASE_TYPE.CRYPTO,
        };
        const mail = new Mail(
          EMAIL_CONFIG.FROM_EMAIL,
          fractor.email,
          title,
          context,
          EMAIL_CONFIG.DIR.WITHDRAWAL_REQUEST,
          template,
          EMAIL_CONFIG.MAIL_REPLY_TO,
        );
        await this.emailService.sendMailFrac(mail);

        if (fractor.notificationSettings?.iaoEventResult)
          await this.sendNotificationWhenWithdrawSuccessForFractor(
            fractor,
            request.requestId,
            request.recipientAddress,
          );
      } catch (error) {
        this.logger.error(error);
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    } else {
      this.logger.error('Not found withdrawal processing');
    }
  }

  private async _handleRedeemNFTEvent(requestData: WorkerDataDto) {
    const session = await this.connection.startSession();
    let request;
    let asset;
    await session.withTransaction(async () => {
      request = await this.dataServices.nftWithdrawalRequest.findOneAndUpdate(
        {
          status: NFT_WITHDRAWAL_REQUEST_STATUS.PROCESSING_BLOCKCHAIN,
          requestId: requestData.metadata.requestId,
        },
        {
          status: NFT_WITHDRAWAL_REQUEST_STATUS.COMPLETED,
          transactionIdHash: requestData.transactionHash,
        },
        {
          session,
        },
      );
      if (!request) {
        this.logger.error(
          `Can't not find request:: ${requestData.metadata.requestId} to update data`,
        );
        return;
      }
      asset = await this.dataServices.asset.findOne({
        itemId: request.itemId,
      });
      const depositNFTs = asset.custodianship.depositedNFTs;
      const withdrawNFTs = request.depositedNFTs;

      // handle data after success withdrawNFTs
      for (let i = 0; i < withdrawNFTs.length; i++) {
        for (let j = 0; j < depositNFTs.length; j++) {
          if (
            new Date(withdrawNFTs[i].createdAt).getTime() ===
              new Date(depositNFTs[j].createdAt).getTime() &&
            withdrawNFTs[i].txHash === depositNFTs[j].txHash &&
            withdrawNFTs[i].tokenId === depositNFTs[j].tokenId
          ) {
            depositNFTs[j].balance -= withdrawNFTs[i].withdrawable;
            depositNFTs[j].withdrawable -= withdrawNFTs[i].withdrawable;
          }
        }
      }
      await this.dataServices.asset.updateOne(
        { itemId: request.itemId },
        {
          'custodianship.status': CUSTODIANSHIP_STATUS.FRACTOR,
          'custodianship.depositedNFTs': depositNFTs,
        },
        { session },
      );
    });
    session.endSession();
    if (!request) {
      return;
    }

    const fractor = await this.dataServices.fractor.findOne({
      fractorId: request.fractorId,
    });

    let title = EMAIL_CONFIG.TITLE.REQUEST_NFT_WITHDRAW_COMPLETED.EN;
    let template = 'NWRC_en';
    if (fractor.localization === LOCALIZATION.CN) {
      title = EMAIL_CONFIG.TITLE.REQUEST_NFT_WITHDRAW_COMPLETED.CN;
      template = 'NWRC_cn';
    }
    if (fractor.localization === LOCALIZATION.JP) {
      title = EMAIL_CONFIG.TITLE.REQUEST_NFT_WITHDRAW_COMPLETED.JA;
      template = 'NWRC_ja';
    }
    if (fractor.localization === LOCALIZATION.VN) {
      title = EMAIL_CONFIG.TITLE.REQUEST_NFT_WITHDRAW_COMPLETED.VI;
      template = 'NWRC_vi';
    }

    const linkAddress =
      asset.network === 'eth'
        ? `${process.env.ETH_SCAN_DOMAIN}/address/${request.recipientWalletAddress}`
        : `${process.env.BSC_SCAN_DOMAIN}/address/${request.recipientWalletAddress}`;

    const localizeUrl = Utils.getPathUrlLocalize(fractor.localization);
    const context = {
      requestId: request.requestId,
      contactEmail: request.contactEmail,
      recipientWalletAddress: request.recipientWalletAddress,
      linkRequest: `${process.env.FRACTOR_DOMAIN}/${localizeUrl}nft-withdrawal-request/last`,
      linkAddress,
      fractorContactUs: `${process.env.FRACTOR_DOMAIN}/${localizeUrl}contact-us`,
    };
    const mail = new Mail(
      EMAIL_CONFIG.FROM_EMAIL,
      request.contactEmail,
      title,
      context,
      EMAIL_CONFIG.DIR.REQUEST_NFT_WITHDRAW,
      template,
      EMAIL_CONFIG.MAIL_REPLY_TO,
    );
    await this.emailService.sendMailFrac(mail);

    const notification = {
      type: NOTIFICATION_TYPE.SYSTEM_MESSAGES,
      receiver: fractor.fractorId,
      read: false,
      subtype: NOTIFICATION_SUBTYPE.WITHDRAWAL_REQUEST_SUCCEEDED,
      extraData: {
        network: asset.network,
        withdrawRequestId: request.requestId,
        recipientAddress: request.recipientWalletAddress,
        isNFTWithdrawRequest: true,
      },
      deleted: false,
      hided: false,
      dexId: null,
    };
    const data = await this.dataServices.notification.create(notification);
    this.socketGateway.sendNotification(
      SOCKET_NAMESPACE.REVENUE_WITHDRAWAL,
      `${SOCKET_NOTIFICATION_EVENT.FRACTOR_WITHDRAWAL_REQUEST_SUCCESSFULLY}_${fractor.fractorId}`,
      data[0],
    );
  }

  private async _handleTraderWithdrawal(requestData: WorkerDataDto) {
    if (requestData.contractAddress === process.env.TRADER_PROXY) {
      if (
        parseInt(requestData.metadata.typeWithdraw) === WithdrawType.AFFILIATE
      ) {
        // affiliate withdrawal
        const session = await this.connection.startSession();
        session.startTransaction();
        try {
          const withdrawalRequestDetail =
            await this.dataServices.userWithdrawalRequest.findOne({
              status: {
                $in: [
                  AFFILIATE_WITHDRAWAL_REQUEST_STATUS.PROCESSING,
                  AFFILIATE_WITHDRAWAL_REQUEST_STATUS.PROCESSING_EXCHANGE,
                ],
              },
              recipientAddress: {
                $regex: requestData.metadata._user,
                $options: 'i',
              },
            });

          const newWithdrawalRequest =
            await this.dataServices.userWithdrawalRequest.findOneAndUpdate(
              {
                requestId: withdrawalRequestDetail.requestId,
                'revenue.contractAddress': Utils.queryInsensitive(
                  requestData.metadata._token,
                ),
              },
              {
                $set: {
                  'revenue.$.txHash': requestData.transactionHash,
                  'revenue.$.transactionCompletedOn': new Date(),
                },
              },
              { session, new: true },
            );

          let countCompleteToken = 0;
          newWithdrawalRequest.revenue.forEach((e) => {
            if (!!e?.txHash) {
              countCompleteToken++;
            }
          });

          if (countCompleteToken === newWithdrawalRequest.revenue.length) {
            const updatedRequest =
              await this.dataServices.userWithdrawalRequest.findOneAndUpdate(
                {
                  requestId: withdrawalRequestDetail.requestId,
                },
                {
                  $set: {
                    status: AFFILIATE_WITHDRAWAL_REQUEST_STATUS.SUCCESSFUL,
                  },
                },
                { session, new: true },
              );
            if (updatedRequest) {
              const user = await this.dataServices.user.findOne({
                userId: updatedRequest.createdBy,
              });
              if (!!updatedRequest.emailReveiceNotification) {
                let title = EMAIL_CONFIG.TITLE.WITHDRAWAL_REQUEST_SUCCEEDED.EN;
                let template =
                  EMAIL_CONFIG.TEMPLATE.AFFILIATE_WITHDRAWAL_REQUEST.EN;
                if (user.localization === LOCALIZATION.CN) {
                  title = EMAIL_CONFIG.TITLE.WITHDRAWAL_REQUEST_SUCCEEDED.CN;
                  template =
                    EMAIL_CONFIG.TEMPLATE.AFFILIATE_WITHDRAWAL_REQUEST.CN;
                }
                if (user.localization === LOCALIZATION.JP) {
                  title = EMAIL_CONFIG.TITLE.WITHDRAWAL_REQUEST_SUCCEEDED.JP;
                  template =
                    EMAIL_CONFIG.TEMPLATE.AFFILIATE_WITHDRAWAL_REQUEST.JP;
                }
                if (user.localization === LOCALIZATION.VN) {
                  title = EMAIL_CONFIG.TITLE.WITHDRAWAL_REQUEST_SUCCEEDED.VN;
                  template =
                    EMAIL_CONFIG.TEMPLATE.AFFILIATE_WITHDRAWAL_REQUEST.VN;
                }

                const context = {
                  requestId: updatedRequest.requestId,
                  recipientWalletAddress: updatedRequest.recipientAddress,
                  isSuccessful: true,
                  txHash: requestData.transactionHash,
                  fractorDomain: process.env.FRACTOR_DOMAIN,
                  adminDomain: process.env.ADMIN_DOMAIN,
                  traderDomain: process.env.TRADER_DOMAIN,
                  landingPage: process.env.LANDING_PAGE,
                  dexDomain: process.env.DEX_DOMAIN,
                  contactUs: `${process.env.TRADER_DOMAIN}/${user.localization}/contact-us`,
                  bscDomain: process.env.BSC_SCAN_DOMAIN,
                  localization: user.localization,
                };

                const mail = new Mail(
                  EMAIL_CONFIG.FROM_EMAIL,
                  updatedRequest.emailReveiceNotification,
                  title,
                  context,
                  EMAIL_CONFIG.DIR.WITHDRAWAL_REQUEST,
                  template,
                  EMAIL_CONFIG.MAIL_REPLY_TO,
                );
                await this.emailService.sendMailFrac(mail);
              }

              const notification =
                this.workerBuilder.createNotificationForWithdrawalSuccessfully(
                  user.userId,
                  updatedRequest.requestId,
                  updatedRequest.recipientAddress,
                  NOTIFICATION_SUBTYPE.WITHDRAWAL_REQUEST_SUCCEEDED,
                );

              const data = await this.dataServices.notification.create(
                notification,
              );

              const notificationForDex: NotificationForDexEntity = {
                uuid: data[0]._id.toString(),
                type: data[0].subtype,
                data: data[0].extraData,
                walletAddress: user.walletAddress,
              };
              try {
                await axios.post(
                  `${process.env.SPOT_DEX_DOMAIN}/api/v1/iao/notification`,
                  { data: [notificationForDex] },
                  {
                    headers: { 'api-key': `${process.env.SPOT_DEX_API_KEY}` },
                  },
                );
                this.logger.log(`Send notification to Dex successfully`);
              } catch (error) {
                this.logger.error(`Error when call api to DEX:: ${error}`);
              }

              this.socketGateway.sendMessage(
                SOCKET_EVENT.TRADER_WITHDRAWL,
                requestData,
                requestData.metadata._user,
              );
            }
          }

          await session.commitTransaction();
        } catch (error) {
          this.logger.error(error);
          await session.abortTransaction();
          throw error;
        } finally {
          await session.endSession();
        }
      } else if (
        parseInt(requestData.metadata.typeWithdraw) === WithdrawType.FRACTOR
      ) {
        // fractor withdrawal
        const session = await this.connection.startSession();
        session.startTransaction();
        try {
          const withdrawalRequestDetail =
            await this.dataServices.withdrawalRequest.findOne({
              status: {
                $in: [
                  WITHDRAWAL_REQUEST_STATUS.PROCESSING,
                  WITHDRAWAL_REQUEST_STATUS.PROCESSING_EXCHANGE,
                ],
              },
              revenueSource: REVENUE_SOURCE.EXCHANGE,
              recipientAddress: {
                $regex: requestData.metadata._user,
                $options: 'i',
              },
              createdBy: requestData.metadata.fractorId,
            });

          const newWithdrawalRequest =
            await this.dataServices.withdrawalRequest.findOneAndUpdate(
              {
                requestId: withdrawalRequestDetail.requestId,
                'revenue.currencyContract': Utils.queryInsensitive(
                  requestData.metadata._token,
                ),
              },
              {
                $set: {
                  'revenue.$.txHash': requestData.transactionHash,
                  'revenue.$.transactionCompletedOn': new Date(),
                },
              },
              { session, new: true },
            );
          try {
            const dataCurrency = await this.dataServices.exchangeRate.findOne(
              {
                contractAddress: Utils.queryInsensitive(
                  requestData.metadata._token,
                ),
              },
              { _id: 0, contractAddress: 1, exchangeRate: 1 },
            );
            const tokenUsdPrice = dataCurrency?.exchangeRate || 0;
            await this.dataServices.withdrawalRequest.findOneAndUpdate(
              {
                requestId: withdrawalRequestDetail.requestId,
                'revenue.currencyContract': requestData.metadata._token,
              },
              {
                'revenue.$.acceptedCurrencyUsdPrice': tokenUsdPrice,
              },
              { session },
            );
          } catch (error) {
            await this.dataServices.withdrawalRequest.findOneAndUpdate(
              {
                requestId: withdrawalRequestDetail.requestId,
                'revenue.currencyContract': requestData.metadata._token,
              },
              {
                'revenue.$.acceptedCurrencyUsdPrice': 0,
              },
              { session },
            );
          }
          let countCompleteToken = 0;
          newWithdrawalRequest.revenue.forEach((e) => {
            if (!!e?.txHash) {
              countCompleteToken++;
            }
          });
          if (countCompleteToken === newWithdrawalRequest.revenue.length) {
            const updatedRequest =
              await this.dataServices.withdrawalRequest.findOneAndUpdate(
                {
                  requestId: withdrawalRequestDetail.requestId,
                },
                {
                  $set: {
                    status: WITHDRAWAL_REQUEST_STATUS.SUCCESSFUL,
                  },
                },
                { session, new: true },
              );
            if (updatedRequest) {
              const fractor = await this.dataServices.fractor.findOne({
                fractorId: updatedRequest.createdBy,
              });

              let title = EMAIL_CONFIG.TITLE.WITHDRAWAL_REQUEST_SUCCEEDED.EN;
              let template = EMAIL_CONFIG.TEMPLATE.WITHDRAWAL_REQUEST.EN;
              if (fractor.localization === LOCALIZATION.CN) {
                title = EMAIL_CONFIG.TITLE.WITHDRAWAL_REQUEST_SUCCEEDED.CN;
                template = EMAIL_CONFIG.TEMPLATE.WITHDRAWAL_REQUEST.CN;
              }
              if (fractor.localization === LOCALIZATION.JP) {
                title = EMAIL_CONFIG.TITLE.WITHDRAWAL_REQUEST_SUCCEEDED.JP;
                template = EMAIL_CONFIG.TEMPLATE.WITHDRAWAL_REQUEST.JP;
              }
              if (fractor.localization === LOCALIZATION.VN) {
                title = EMAIL_CONFIG.TITLE.WITHDRAWAL_REQUEST_SUCCEEDED.VN;
                template = EMAIL_CONFIG.TEMPLATE.WITHDRAWAL_REQUEST.VN;
              }
              const context = {
                requestId: updatedRequest.requestId,
                recipientName: fractor.fullname || '',
                recipientWalletAddress: updatedRequest.recipientAddress,
                email: fractor.email,
                txHash: requestData.transactionHash,
                fractorDomain: process.env.FRACTOR_DOMAIN,
                adminDomain: process.env.ADMIN_DOMAIN,
                traderDomain: process.env.TRADER_DOMAIN,
                landingPage: process.env.LANDING_PAGE,
                dexDomain: process.env.DEX_DOMAIN,
                contactUs: `${process.env.TRADER_DOMAIN}/${fractor.localization}/contact-us`,
                bscDomain: process.env.BSC_SCAN_DOMAIN,
                localization: fractor.localization,
                isCrypto: withdrawalRequestDetail.requestType === PURCHASE_TYPE.CRYPTO
              };
              const mail = new Mail(
                EMAIL_CONFIG.FROM_EMAIL,
                fractor.email,
                title,
                context,
                EMAIL_CONFIG.DIR.WITHDRAWAL_REQUEST,
                template,
                EMAIL_CONFIG.MAIL_REPLY_TO,
              );
              await this.emailService.sendMailFrac(mail);

              const notification =
                this.workerBuilder.createNotificationForWithdrawalSuccessfully(
                  fractor.fractorId,
                  updatedRequest.requestId,
                  updatedRequest.recipientAddress,
                  NOTIFICATION_SUBTYPE.WITHDRAWAL_REQUEST_SUCCEEDED,
                );

              await this.dataServices.notification.create(notification);
            }
          }
          await session.commitTransaction();
        } catch (error) {
          this.logger.error(error);
          await session.abortTransaction();
          throw error;
        } finally {
          await session.endSession();
        }
      }
    }
  }

  private async _handleCreateTieringPool(requestData: WorkerDataDto) {
    if (requestData.contractAddress === process.env.CONTRACT_DIAMOND_ALPHA) {
      await this.tieringPoolService.createTieringPool(
        requestData.metadata as CreateTieringPoolDto,
      );
    } else {
      this.logger.error('Failed Contract Proxy Tiering Pool in .env file');
    }
  }

  private async _handleUnstake(requestData: WorkerDataDto) {
    if (requestData.contractAddress === process.env.CONTRACT_DIAMOND_ALPHA) {
      const stakingInfo: StakingInfoDto = {
        walletAddress: requestData.metadata.account,
        value: requestData.metadata.amount,
        transactionHash: requestData.transactionHash,
      };
      await this.stakingHistoryService.unStaking(stakingInfo);

      this.socketGateway.sendMessage(
        SOCKET_EVENT.UN_STAKE_EVENT,
        stakingInfo,
        requestData.metadata.account,
      );
    }
  }
  private async _handleStake(requestData: WorkerDataDto) {
    if (requestData.contractAddress === process.env.CONTRACT_DIAMOND_ALPHA) {
      const stakingInfo: StakingInfoDto = {
        walletAddress: requestData.metadata.account,
        value: requestData.metadata.amount,
        transactionHash: requestData.transactionHash,
      };
      await this.stakingHistoryService.staking(stakingInfo);

      this.socketGateway.sendMessage(
        SOCKET_EVENT.STAKE_EVENT,
        stakingInfo,
        requestData.metadata.account,
      );
    }
  }

  private async _callApiAddCoinToDex(fNFTContractAddress: string) {
    const fNFT = await this.dataServices.fnft.findOne({
      contractAddress: fNFTContractAddress,
    });
    this.logger.log(`Starting add token ${fNFT.tokenSymbol} to DEX`);
    const file = await this._getFileContentById(fNFT.tokenLogo);
    const fileName = await this._getFileNameFromURL(fNFT.tokenLogo);
    const formData = new FormData();
    formData.append('network', fNFT.chainId);
    formData.append('name', fNFT.tokenName);
    formData.append('symbol', fNFT.tokenSymbol);
    formData.append('decimal', '18');
    formData.append('bsc_address', fNFTContractAddress);
    formData.append('is_fnft', 'true');
    formData.append('file', file, fileName);

    try {
      await axios.post(
        `${process.env.SPOT_DEX_DOMAIN}/${SPOT_DEX_URL.ADD_COINT}`,
        formData,
        {
          headers: {
            'API-Key': `${process.env.SPOT_DEX_API_KEY}`,
            'Content-Type': 'multipart/form-data',
            ...formData.getHeaders(),
          },
        },
      );
      this.logger.log('Add token to DEX successfully');
    } catch (err) {
      this.logger.error('Err when call add coint to DEX: ');
      this.logger.error(JSON.stringify(err?.response?.data?.message));
      if (err?.response?.data?.code === 40002) {
        this.logger.warn('Coin existed in DEX');
      }
    }
  }

  private async _getFileContentById(url: string): Promise<any> {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
    });
    await fetch(url).then((r) => r.blob());
    return Buffer.from(response.data, 'base64');
  }

  private async _getFileNameFromURL(urlStr: string) {
    const url = require('url');
    const path = require('path');
    const parsed = url.parse(urlStr);
    return path.basename(parsed.pathname);
  }

  private async _uploadIpfsAsset(assetId: string): Promise<any> {
    const asset = await this.dataServices.asset.findOne({
      itemId: assetId,
    });
    const nft = await this.dataServices.nft.findOne({
      assetId,
    });

    // Upload ipfs
    const ipfs = new IpfsGateway(IpfsClientType.PINATA_CLOUD);
    let assetDoc = '';
    for (let index = 0; index < asset.documents.length; index++) {
      const document = asset.documents[index];
      if (!document.ipfsCid) {
        const cid = await ipfs.uploadFromURL(document.fileUrl, MIMEType.PDF);
        document.ipfsCid = cid;
        await this.dataServices.asset.updateOne(
          { itemId: assetId, 'documents._id': document['_id'] },
          {
            $set: {
              'documents.$.ipfsCid': cid,
            },
          },
        );
      }
      assetDoc += `No: ${index + 1}\n`;
      assetDoc += `Name: ${document.name}\n`;
      assetDoc += `Description: ${document.description}\n`;
      assetDoc += `Link: ipfs://${document.ipfsCid}\n`;
      assetDoc += index === asset.documents.length - 1 ? '' : '\n';
    }
    if (assetDoc === '') {
      return 'n/a';
    }
    const assetCid = await ipfs.upload({
      fieldname: assetId,
      buffer: Buffer.from(assetDoc, 'utf-8'),
      mimetype: MIMEType.TEXT_PLAIN,
    } as any);

    // Update metadata
    const { data } = await axios.get(nft.metadataUrl);
    const nftMetadata: NftMetadataEntity = { ...data };
    nftMetadata.asset_url = `ipfs://${assetCid}`;
    await this.s3Service.uploadNftMetadata(
      nftMetadata,
      nft.tokenId.split('-')[1],
    );
    return assetCid;
  }
}
