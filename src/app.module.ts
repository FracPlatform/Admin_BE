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
import { getConnectionToken, MongooseModule } from '@nestjs/mongoose';
import { Asset, AssetSchema } from './datalayer/model';
import { Connection } from 'mongoose';
import * as AutoIncrementFactory from 'mongoose-sequence';
import { S3Module } from './s3/s3.module';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: Asset.name,
        useFactory: (connection: Connection) => {
          const AutoIncrement = AutoIncrementFactory(connection);
          const schema = AssetSchema;
          schema.plugin(AutoIncrement, {
            inc_field: 'itemId',
            start_seq: 1,
          });
          return schema;
        },
        inject: [getConnectionToken()],
      }
    ]),
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
  ],
  controllers: [AppController],
})
export class AppModule {}
