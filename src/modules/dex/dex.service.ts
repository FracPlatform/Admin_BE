import { Injectable, Logger } from '@nestjs/common';
import { ApiError } from 'src/common/api';
import { ErrorCode } from 'src/common/constants';
import { IDataServices } from 'src/core/abstracts/data-services.abstract';
import { AffiliateFeeEntity, FractorFeeEntity } from 'src/entity/dex.entity';
import { Web3ETH } from '../../blockchain/web3.eth';
import { AwsUtils } from '../../common/aws.util';
import {
  Asset,
  AssetType,
  GasWalletModel,
  NOTIFICATION_SUBTYPE,
  NOTIFICATION_TYPE,
  USER_ROLE,
  USER_STATUS,
  WALLET_TYPE,
} from '../../datalayer/model';
import {
  CreateNotificationDto,
  NotificationDto,
  UpdateNotificationDto,
} from './dto/notification.dto';

@Injectable()
export class DexService {
  private readonly logger = new Logger(DexService.name);
  constructor(private readonly dataService: IDataServices) {}

  async getFractorFeeById(id: string): Promise<FractorFeeEntity> {
    const fractor = await this.dataService.fractor.findOne({
      fractorId: id,
    });
    if (!fractor)
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'Fractor does not exists');
    return {
      iaoFeeRate: fractor.iaoFeeRate,
      tradingFeeProfit: fractor.tradingFeeProfit,
    };
  }

  async getAffiliateFee(walletAddress: string): Promise<AffiliateFeeEntity[]> {
    this.logger.log(`Get affiliate fee of ${walletAddress}: `);
    const res = [];
    const web3Service = new Web3ETH();
    const user = await this.dataService.user.findOne({
      walletAddress: web3Service.toChecksumAddress(walletAddress),
    });
    const affiliateOfUser = await this.dataService.user.findOne({
      walletAddress: user?.referedBy,
    });
    if (!affiliateOfUser) {
      return res;
    }
    if (affiliateOfUser.role === USER_ROLE.MASTER_AFFILIATE) {
      if (affiliateOfUser.bd) {
        const bdOfAffiliate = await this.dataService.admin.findOne({
          adminId: affiliateOfUser.bd,
        });
        res.push({
          role: USER_ROLE.BD_OF_AFFILIATE,
          walletAddress: bdOfAffiliate.walletAddress,
          feeReceive: bdOfAffiliate.commissionRate,
        });
      }
      res.push({
        role: affiliateOfUser.role,
        walletAddress: affiliateOfUser.walletAddress,
        feeReceive: affiliateOfUser.commissionRate,
      });
    } else if (affiliateOfUser.role === USER_ROLE.AFFILIATE_SUB_1) {
      const masterAffiliate = await this.dataService.user.findOne({
        userId: affiliateOfUser.masterId,
      });
      if (masterAffiliate.bd) {
        const bdOfAffiliate = await this.dataService.admin.findOne({
          adminId: masterAffiliate.bd,
        });
        res.push({
          role: USER_ROLE.BD_OF_AFFILIATE,
          walletAddress: bdOfAffiliate.walletAddress,
          feeReceive: bdOfAffiliate.commissionRate,
        });
      }
      // rate for sub1
      res.push({
        role: affiliateOfUser.role,
        walletAddress: affiliateOfUser.walletAddress,
        feeReceive: affiliateOfUser.commissionRate,
      });
      // rate for master affiliate
      res.push({
        role: masterAffiliate.role,
        walletAddress: masterAffiliate.walletAddress,
        feeReceive:
          masterAffiliate.commissionRate - affiliateOfUser.commissionRate,
      });
    } else if (affiliateOfUser.role === USER_ROLE.AFFILIATE_SUB_2) {
      const masterAffiliate = await this.dataService.user.findOne({
        userId: affiliateOfUser.masterId,
      });
      if (masterAffiliate.bd) {
        const bdOfAffiliate = await this.dataService.admin.findOne({
          adminId: masterAffiliate.bd,
        });
        res.push({
          role: USER_ROLE.BD_OF_AFFILIATE,
          walletAddress: bdOfAffiliate.walletAddress,
          feeReceive: bdOfAffiliate.commissionRate,
        });
      }
      const sub1Affiliate = await this.dataService.user.findOne({
        userId: affiliateOfUser.subFirstId,
      });
      // rate for sub1
      res.push({
        role: sub1Affiliate.role,
        walletAddress: sub1Affiliate.walletAddress,
        feeReceive:
          sub1Affiliate.commissionRate - affiliateOfUser.commissionRate,
      });
      // rate for sub2
      res.push({
        role: affiliateOfUser.role,
        walletAddress: affiliateOfUser.walletAddress,
        feeReceive: affiliateOfUser.commissionRate,
      });
      // rate for master affiliate
      res.push({
        role: masterAffiliate.role,
        walletAddress: masterAffiliate.walletAddress,
        feeReceive:
          masterAffiliate.commissionRate - sub1Affiliate.commissionRate,
      });
    }
    this.logger.log(JSON.stringify(res));
    return res;
  }

  async createNotification(data: CreateNotificationDto) {
    const users = await this._mapWalletAddressToId(data.data);
    let notifications = [];
    for (let i = 0; i < data.data.length; i++) {
      if (data.data[i].type === NOTIFICATION_SUBTYPE.UserTierChanged) {
        const notiAnnount = this._createNotificationEntity(data.data[i], users);
        notifications.push(notiAnnount);
      } else {
        const traders = await this.dataService.user.findMany({
          status: USER_STATUS.ACTIVE,
          'notificationSettings.announcements': true,
        });
        const idTraders = traders.map((trader) => trader.userId);

        const notiSystem = idTraders.map((id) =>
          this._createSystemNotificationEntity(data.data[i], id),
        );
        notifications = notifications.concat(notiSystem);
      }
    }
    await this.dataService.notification.insertMany(notifications);
  }

  async readNotification(walletAddress: string, data: UpdateNotificationDto) {
    const user = await this.dataService.user.findOne({
      walletAddress: walletAddress,
    });
    const dexIds = data.uuids.filter(
      (e) => e.search('-') !== -1 && e.split('-')[0] !== 'NT',
    );
    const iaoIds = data.uuids.filter((e) => e.search('-') === -1);
    const systemNoti = data.uuids.filter(
      (e) => e.search('-') !== -1 && e.split('-')[0] === 'NT',
    );
    await this.dataService.notification.updateMany(
      {
        receiver: user.userId,
        $or: [
          {
            dexId: {
              $in: dexIds,
            },
          },
          {
            _id: {
              $in: iaoIds,
            },
          },
          {
            notiQueueId: {
              $in: systemNoti,
            },
          },
        ],
      },
      {
        $set: {
          read: true,
        },
      },
    );

    return { success: true };
  }

  async deleteNotification(walletAddress: string, data: UpdateNotificationDto) {
    const user = await this.dataService.user.findOne({
      walletAddress: walletAddress,
    });

    await this.dataService.notification.updateMany(
      {
        receiver: user.userId,
        dexId: {
          $in: data.uuids,
        },
      },
      {
        $set: {
          deleted: true,
        },
      },
    );

    return { success: true };
  }

  async hideNotification(walletAddress: string, data: UpdateNotificationDto) {
    const user = await this.dataService.user.findOne({
      walletAddress: walletAddress,
    });

    await this.dataService.notification.updateMany(
      {
        receiver: user.userId,
        dexId: {
          $in: data.uuids,
        },
      },
      {
        $set: {
          hided: true,
        },
      },
    );

    return { success: true };
  }

  private async _mapWalletAddressToId(data: NotificationDto[]) {
    const listWallet = data
      .filter((e) => e)
      .map((e) => {
        if (e.walletAddress) return e.walletAddress;
      });
    if (listWallet.length === 0) {
      return [];
    }
    const users = await this.dataService.user.findMany(
      {
        walletAddress: { $in: listWallet },
      },
      {
        _id: 0,
        walletAddress: 1,
        userId: 1,
      },
    );
    return users;
  }

  private _createNotificationEntity(
    notification: NotificationDto,
    users: Array<any>,
  ) {
    return {
      receiver: users.find(
        (e) => e.walletAddress === notification.walletAddress,
      )?.userId,
      type:
        notification.type === NOTIFICATION_SUBTYPE.UserTierChanged
          ? NOTIFICATION_TYPE.SYSTEM_MESSAGES
          : NOTIFICATION_TYPE.ANNOUNCEMENT,
      notiQueueId: null,
      read: false,
      title: null,
      content: null,
      subtype: notification.type,
      extraData: notification.data,
      deleted: false,
      hided: false,
      dexId: notification.uuid,
    };
  }

  private _createSystemNotificationEntity(
    notification: NotificationDto,
    userId,
  ) {
    return {
      receiver: userId,
      type:
        notification.type === NOTIFICATION_SUBTYPE.UserTierChanged
          ? NOTIFICATION_TYPE.SYSTEM_MESSAGES
          : NOTIFICATION_TYPE.ANNOUNCEMENT,
      notiQueueId: null,
      read: false,
      title: null,
      content: null,
      subtype: notification.type,
      extraData: notification.data,
      deleted: false,
      hided: false,
      dexId: notification.uuid,
    };
  }

  async getFNFTByContractAddress(contractAddress: string) {
    const agg = [];
    agg.push(
      { $match: { contractAddress: contractAddress } },
      {
        $lookup: {
          from: 'IAOEvent',
          localField: 'contractAddress',
          foreignField: 'FNFTcontractAddress',
          as: 'iaoEvent',
        },
      },
      {
        $unwind: '$iaoEvent',
      },
      {
        $lookup: {
          from: 'Nft',
          localField: 'items',
          foreignField: 'tokenId',
          as: 'nfts',
        },
      },
      {
        $project: {
          tokenSymbol: '$tokenSymbol',
          totalSupply: '$totalSupply',
          nfts: '$nfts',
          fnftId: '$fnftId',
          contractAddress: '$contractAddress',
          iaoEvent: '$iaoEvent',
        },
      },
      {
        $project: {
          _id: 0,
        },
      },
    );

    const dataQuery = await this.dataService.fnft.aggregate(agg, {
      collation: { locale: 'en' },
    });
    if (dataQuery.length === 0) {
      return {};
    }
    const listAssetType = await this.dataService.assetTypes.findMany({});
    const listAsset = await this.dataService.asset.findMany({});
    const res = await this._convertFNFT(dataQuery[0], listAssetType, listAsset);
    return res;
  }

  private async _convertFNFT(
    fNft: any,
    listAssetType: AssetType[],
    listAsset: Asset[],
  ) {
    return {
      tokenSymbol: fNft.tokenSymbol,
      totalSupply: fNft.totalSupply,
      fnftId: fNft.fnftId,
      contractAddress: fNft.contractAddress,
      revenue: {
        status: fNft.iaoEvent.revenue.status,
      },
      ownershipPercent: fNft.ownershipPercent,
      iaoEventId: fNft.iaoEvent.iaoEventId,
      nfts: fNft.nfts.map((nft) => {
        const assetType = listAssetType.find(
          (assetType) => assetType.assetTypeId === nft.assetType,
        );
        const asset = listAsset.find((asset) => asset.itemId === nft.assetId);
        return {
          name: nft.name,
          tokenId: nft.tokenId,
          mediaUrl: nft.mediaUrl,
          previewUrl: nft.previewUrl,
          unlockableContent: nft.unlockableContent,
          assetType: {
            borderColor: assetType.borderColor,
            name: assetType.name,
          },
          asset: {
            _id: asset['_id'],
            collectionId: asset.collectionId,
            name: asset.name,
            isMintNFT: asset.isMintNFT,
          },
        };
      }),
    };
  }

  async getGasWallet() {
    const wallet = await this.dataService.gasWalletModel.findOne({
      walletType: WALLET_TYPE.DEX,
    });
    return this._createWalletResponse(wallet);
  }

  async _createWalletResponse(wallet: GasWalletModel) {
    return {
      publicKey: wallet.walletAddress,
      privateKey: await AwsUtils.decrypt(wallet.hashKey),
    };
  }
}
