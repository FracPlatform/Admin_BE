import { CacheModule, CacheModuleOptions, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { RedisClientOptions } from 'redis';
import * as redisStore from 'cache-manager-redis-store';
import { ScheduleModule } from '@nestjs/schedule';
import { TasksModule } from './providers/schedule/tasks.module';
import { WorkerModule } from './providers/worker/worker.module';
import { CommonModule } from './common-service/common.module';
import { SocketModule } from './providers/socket/socket.module';
import { DataServicesModule } from './services';
import { S3Module } from './s3/s3.module';
import { AssetTypeModule } from './modules/asset-type/asset-type.module';
import { FractorModule } from './modules/fractor/fractor.module';
import { AuthModule } from './modules/auth/auth.module';
import { IaoRequestModule } from './modules/iao-request/iao-request.module';
import { AssetModule } from './modules/asset/asset.module';
import { AdminModule } from './modules/admin/admin.module';
import { IaoEventModule } from './modules/iao-event/iao-event.module';
import { NftModule } from './modules/nft/nft.module';
import { IPFSMofule } from './providers/ipfs/ipfs.module';
import { FnftModule } from './modules/f-nft/f-nft.module';
import { SettingsModule } from './modules/settings/settings.module';
import { SignerModule } from './modules/signer/signer.module';
import { DexModule } from './modules/dex/dex.module';
import { RedemptionRequestModule } from './modules/redemption-request/redemption-request.module';
import { UserModule } from './modules/user/user.module';
import { IaoRevenueModule } from './modules/revenue/revenue.module';
import { NotificationQueueModule } from './modules/notification-queue/notification-queue.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { NotificationModule } from './modules/notification/notification.module';
import { TieringPoolModule } from './modules/tiering-pool/tiering-pool.module';
import { StakingHistoryModule } from './modules/staking-history/staking-history.module';
import { GasWalletModule } from './modules/gas-wallet/gas-wallet.module';
import { WithdrawalRequestModule } from './modules/withdrawal-request/withdrawal-request.module';
import { EmailSubscriberModule } from './modules/email-subscriber/email-subscriber.module';

@Module({
  imports: [
    DataServicesModule,
    ScheduleModule.forRoot(),
    CacheModule.registerAsync<RedisClientOptions>({
      useFactory: (): CacheModuleOptions => {
        const options = {
          store: redisStore,
          ttl: Number(process.env.REDIS_TTL),
          host: process.env.REDIS_HOST,
          port: Number(process.env.REDIS_PORT || 6379),
        };
        return options;
      },
      isGlobal: true,
    }),
    SocketModule,
    SettingsModule,
    CommonModule,
    TasksModule,
    WorkerModule,
    S3Module,
    AuthModule,
    AdminModule,
    AssetTypeModule,
    FractorModule,
    IaoRequestModule,
    FnftModule,
    AssetModule,
    IaoEventModule,
    NftModule,
    UserModule,
    IPFSMofule,
    SignerModule,
    RedemptionRequestModule,
    DexModule,
    IaoRevenueModule,
    NotificationQueueModule,
    NotificationModule,
    DashboardModule,
    TieringPoolModule,
    StakingHistoryModule,
    GasWalletModule,
    WithdrawalRequestModule,
    EmailSubscriberModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
