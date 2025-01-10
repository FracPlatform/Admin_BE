import { OfferDocument } from './model/offer.model';
import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { IDataServices } from '../core/abstracts/data-services.abstract';
import { IGenericRepository } from '../core/abstracts/generic-repository.abstract';
import { Model } from 'mongoose';
import {
  Asset,
  AssetDocument,
  Fractor,
  FractorDocument,
  AssetType,
  AssetTypeDocument,
  Admin,
  AdminDocument,
  IAORequest,
  IAORequestDocument,
  CounterId,
  CounterIdDocument,
  Fnft,
  FnftDocument,
  IAOEvent,
  Nft,
  IAOEventDocument,
  NftDocument,
  Whitelist,
  WhitelistDocument,
  Settings,
  SettingsDocument,
  Signer,
  SignerDocument,
  User,
  UserDocument,
  Purchase,
  PurchaseDocument,
  ClaimDocument,
  Claim,
  RedemptionRequest,
  RedemptionRequestDocument,
  NotificationQueueDocument,
  NotificationQueue,
  Notification,
  NotificationDocument,
  WithdrawalRequest,
  WithdrawalRequestDocument,
  NFTWithdrawalRequest,
  NFTWithdrawalRequestDocument,
  UserWithdrawal,
  UserWithdrawalDocument,
  Offer,
  TieringPool,
  StakingHistoryDocument,
  StakingHistory,
  TieringPoolDocument,
  GasWalletModel,
  GasWalletDocument,
  ExchangeRate,
  ExchangeRateDocument,
  EmailSubscriber,
  EmailSubscriberDocument,
  CustomerProfile,
  CustomerProfileDocument,
  FiatHistoryTransaction,
  FiatHistoryTransactionDocument,
  FiatPurchase,
  FiatPurchaseDocument,
  VirturalBankAccount,
  VirturalBankAccountDocument,
} from './model';
import { MongoGenericRepository } from './mongo-generic-repository';

@Injectable()
export class MongoServices implements IDataServices, OnApplicationBootstrap {
  fractor: IGenericRepository<Fractor>;
  assetTypes: IGenericRepository<AssetType>;
  asset: IGenericRepository<Asset>;
  admin: IGenericRepository<Admin>;
  iaoRequest: IGenericRepository<IAORequest>;
  counterId: IGenericRepository<CounterId>;
  fnft: IGenericRepository<Fnft>;
  iaoEvent: IGenericRepository<IAOEvent>;
  nft: IGenericRepository<Nft>;
  whitelist: IGenericRepository<Whitelist>;
  settings: IGenericRepository<Settings>;
  signer: IGenericRepository<Signer>;
  user: IGenericRepository<User>;
  purchase: IGenericRepository<Purchase>;
  claim: IGenericRepository<Claim>;
  redemptionRequest: IGenericRepository<RedemptionRequest>;
  notificationQueue: IGenericRepository<NotificationQueueDocument>;
  notification: IGenericRepository<NotificationDocument>;
  withdrawalRequest: IGenericRepository<WithdrawalRequest>;
  nftWithdrawalRequest: IGenericRepository<NFTWithdrawalRequest>;
  userWithdrawalRequest: IGenericRepository<UserWithdrawal>;
  offer: IGenericRepository<Offer>;
  tieringPool: IGenericRepository<TieringPool>;
  stakingHistory: IGenericRepository<StakingHistory>;
  gasWalletModel: IGenericRepository<GasWalletModel>;
  exchangeRate: IGenericRepository<ExchangeRate>;
  emailSubscriber: IGenericRepository<EmailSubscriber>;
  customerProfile: IGenericRepository<CustomerProfile>;
  fiatHistoryTransaction: IGenericRepository<FiatHistoryTransaction>;
  fiatPurchase: IGenericRepository<FiatPurchase>;
  virturalBankAccount: IGenericRepository<VirturalBankAccount>;

  constructor(
    @InjectModel(Fractor.name)
    private FractorUserRepository: Model<FractorDocument>,
    @InjectModel(AssetType.name)
    private AssetTypeRepository: Model<AssetTypeDocument>,
    @InjectModel(Asset.name)
    private AssetRepository: Model<AssetDocument>,
    @InjectModel(Admin.name)
    private AdminRepository: Model<AdminDocument>,
    @InjectModel(IAORequest.name)
    private IAORequestRepository: Model<IAORequestDocument>,
    @InjectModel(CounterId.name)
    private CounterIdRepository: Model<CounterIdDocument>,
    @InjectModel(Fnft.name)
    private FnftRepository: Model<FnftDocument>,
    @InjectModel(IAOEvent.name)
    private IAOEventRepository: Model<IAOEventDocument>,
    @InjectModel(Nft.name) private NftRepository: Model<NftDocument>,
    @InjectModel(Whitelist.name)
    private WhitelistRepository: Model<WhitelistDocument>,
    @InjectModel(Settings.name)
    private SettingsRepository: Model<SettingsDocument>,
    @InjectModel(Signer.name)
    private SignerRepository: Model<SignerDocument>,
    @InjectModel(User.name)
    private UserRepository: Model<UserDocument>,
    @InjectModel(Purchase.name)
    private PurchaseRepository: Model<PurchaseDocument>,
    @InjectModel(Claim.name)
    private ClaimRepository: Model<ClaimDocument>,
    @InjectModel(RedemptionRequest.name)
    private redemptionRequestRepository: Model<RedemptionRequestDocument>,
    @InjectModel(NotificationQueue.name)
    private notificationQueueRepository: Model<NotificationQueueDocument>,
    @InjectModel(Notification.name)
    private notificationRepository: Model<NotificationDocument>,
    @InjectModel(WithdrawalRequest.name)
    private WithdrawalRequest: Model<WithdrawalRequestDocument>,
    @InjectModel(NFTWithdrawalRequest.name)
    private nftWithdrawalRequestRepository: Model<NFTWithdrawalRequestDocument>,
    @InjectModel(UserWithdrawal.name)
    private userWithdrawalRequestRepository: Model<UserWithdrawalDocument>,
    @InjectModel(Offer.name)
    private offerRepository: Model<OfferDocument>,
    @InjectModel(TieringPool.name)
    private tieringPoolRepository: Model<TieringPoolDocument>,
    @InjectModel(StakingHistory.name)
    private stakingHistoryRepository: Model<StakingHistoryDocument>,
    @InjectModel(GasWalletModel.name)
    private gasWalletModelRepository: Model<GasWalletDocument>,
    @InjectModel(ExchangeRate.name)
    private exchangeRateRepository: Model<ExchangeRateDocument>,
    @InjectModel(EmailSubscriber.name)
    private emailSubscriberRepository: Model<EmailSubscriberDocument>,
    @InjectModel(CustomerProfile.name)
    private customerProfileRepository: Model<CustomerProfileDocument>,
    @InjectModel(FiatHistoryTransaction.name)
    private fiatHistoryTransactionRepository: Model<FiatHistoryTransactionDocument>,
    @InjectModel(FiatPurchase.name)
    private fiatPurchaseRepository: Model<FiatPurchaseDocument>,
    @InjectModel(VirturalBankAccount.name)
    private virturalBankAccountRepository: Model<VirturalBankAccountDocument>,
  ) {}

  onApplicationBootstrap() {
    this.fractor = new MongoGenericRepository<FractorDocument>(
      this.FractorUserRepository,
    );
    this.assetTypes = new MongoGenericRepository<AssetTypeDocument>(
      this.AssetTypeRepository,
    );
    this.asset = new MongoGenericRepository<AssetDocument>(
      this.AssetRepository,
    );
    this.admin = new MongoGenericRepository<AdminDocument>(
      this.AdminRepository,
    );
    this.iaoRequest = new MongoGenericRepository<IAORequestDocument>(
      this.IAORequestRepository,
    );
    this.counterId = new MongoGenericRepository<CounterIdDocument>(
      this.CounterIdRepository,
    );
    this.fnft = new MongoGenericRepository<FnftDocument>(this.FnftRepository);
    this.iaoEvent = new MongoGenericRepository<IAOEventDocument>(
      this.IAOEventRepository,
    );
    this.nft = new MongoGenericRepository<NftDocument>(this.NftRepository);
    this.whitelist = new MongoGenericRepository<WhitelistDocument>(
      this.WhitelistRepository,
    );
    this.settings = new MongoGenericRepository<SettingsDocument>(
      this.SettingsRepository,
    );

    this.signer = new MongoGenericRepository<SignerDocument>(
      this.SignerRepository,
    );

    this.user = new MongoGenericRepository<UserDocument>(this.UserRepository);

    this.purchase = new MongoGenericRepository<PurchaseDocument>(
      this.PurchaseRepository,
    );

    this.claim = new MongoGenericRepository<ClaimDocument>(
      this.ClaimRepository,
    );

    this.redemptionRequest =
      new MongoGenericRepository<RedemptionRequestDocument>(
        this.redemptionRequestRepository,
      );

    this.notificationQueue =
      new MongoGenericRepository<NotificationQueueDocument>(
        this.notificationQueueRepository,
      );

    this.notification = new MongoGenericRepository<NotificationDocument>(
      this.notificationRepository,
    );

    this.withdrawalRequest =
      new MongoGenericRepository<WithdrawalRequestDocument>(
        this.WithdrawalRequest,
      );

    this.nftWithdrawalRequest =
      new MongoGenericRepository<NFTWithdrawalRequestDocument>(
        this.nftWithdrawalRequestRepository,
      );

    this.userWithdrawalRequest =
      new MongoGenericRepository<UserWithdrawalDocument>(
        this.userWithdrawalRequestRepository,
      );

    this.offer = new MongoGenericRepository<OfferDocument>(
      this.offerRepository,
    );

    this.tieringPool = new MongoGenericRepository<TieringPoolDocument>(
      this.tieringPoolRepository,
    );

    this.stakingHistory = new MongoGenericRepository<StakingHistoryDocument>(
      this.stakingHistoryRepository,
    );

    this.gasWalletModel = new MongoGenericRepository<GasWalletDocument>(
      this.gasWalletModelRepository,
    );

    this.exchangeRate = new MongoGenericRepository<ExchangeRateDocument>(
      this.exchangeRateRepository,
    );

    this.emailSubscriber = new MongoGenericRepository<EmailSubscriberDocument>(
      this.emailSubscriberRepository,
    );

    this.customerProfile = new MongoGenericRepository<CustomerProfileDocument>(
      this.customerProfileRepository,
    );

    this.fiatHistoryTransaction = new MongoGenericRepository<FiatHistoryTransactionDocument>(
      this.fiatHistoryTransactionRepository,
    );

    this.fiatPurchase = new MongoGenericRepository<FiatPurchaseDocument>(
      this.fiatPurchaseRepository,
    );

    this.virturalBankAccount = new MongoGenericRepository<VirturalBankAccountDocument>(
      this.virturalBankAccountRepository,
    );
  }
}
