import { CacheModule, Module } from '@nestjs/common';
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
import { FnftModule } from './modules/f-nft/f-nft.module';

@Module({
  imports: [
    DataServicesModule,
    ScheduleModule.forRoot(),
    CacheModule.register<RedisClientOptions>({
      store: redisStore,
      socket: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.PORT),
      },
      ttl: Number(process.env.REDIS_TTL),
      isGlobal: true,
    }),
    SocketModule,
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
  ],
  controllers: [AppController],
})
export class AppModule {}
