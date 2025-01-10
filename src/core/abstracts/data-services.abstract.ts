import { IAOEvent } from 'src/datalayer/model/iao-event.model';
import {
  Fractor,
  Asset,
  AssetType,
  Admin,
  IAORequest,
  CounterId,
  Fnft,
  Nft,
  Whitelist,
  Settings,
  Signer,
  User,
  Purchase,
  Claim,
  RedemptionRequest,
  NotificationQueue,
  Notification,
  WithdrawalRequest,
  NFTWithdrawalRequest,
  UserWithdrawal,
  Offer,
  StakingHistory,
  TieringPool,
  GasWalletModel,
  ExchangeRate,
  EmailSubscriber,
  CustomerProfile,
  FiatHistoryTransaction,
  VirturalBankAccount,
  FiatPurchase
} from '../../datalayer/model';
import { IGenericRepository } from './generic-repository.abstract';

export abstract class IDataServices {
  abstract fractor: IGenericRepository<Fractor>;
  abstract asset: IGenericRepository<Asset>;
  abstract assetTypes: IGenericRepository<AssetType>;
  abstract admin: IGenericRepository<Admin>;
  abstract iaoRequest: IGenericRepository<IAORequest>;
  abstract counterId: IGenericRepository<CounterId>;
  abstract fnft: IGenericRepository<Fnft>;
  abstract nft: IGenericRepository<Nft>;
  abstract iaoEvent: IGenericRepository<IAOEvent>;
  abstract whitelist: IGenericRepository<Whitelist>;
  abstract settings: IGenericRepository<Settings>;
  abstract signer: IGenericRepository<Signer>;
  abstract user: IGenericRepository<User>;
  abstract purchase: IGenericRepository<Purchase>;
  abstract claim: IGenericRepository<Claim>;
  abstract redemptionRequest: IGenericRepository<RedemptionRequest>;
  abstract notificationQueue: IGenericRepository<NotificationQueue>;
  abstract notification: IGenericRepository<Notification>;
  abstract withdrawalRequest: IGenericRepository<WithdrawalRequest>;
  abstract nftWithdrawalRequest: IGenericRepository<NFTWithdrawalRequest>;
  abstract userWithdrawalRequest: IGenericRepository<UserWithdrawal>;
  abstract offer: IGenericRepository<Offer>;
  abstract tieringPool: IGenericRepository<TieringPool>;
  abstract stakingHistory: IGenericRepository<StakingHistory>;
  abstract gasWalletModel: IGenericRepository<GasWalletModel>;
  abstract exchangeRate: IGenericRepository<ExchangeRate>;
  abstract emailSubscriber: IGenericRepository<EmailSubscriber>;
  abstract customerProfile: IGenericRepository<CustomerProfile>;
  abstract fiatHistoryTransaction: IGenericRepository<FiatHistoryTransaction>;
  abstract fiatPurchase: IGenericRepository<FiatPurchase>;
  abstract virturalBankAccount: IGenericRepository<VirturalBankAccount>;
}
