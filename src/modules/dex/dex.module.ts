import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { DataServicesModule } from 'src/services';
import { DexController } from './dex.controller';
import { DexService } from './dex.service';
import { DexAdminController } from './dex-admin.controller';
import { DexAdminService } from './dex-admin.service';
import { HttpModule } from '@nestjs/axios';
import { MAX_BODY_LENGTH } from '../../common/constants';

@Module({
  imports: [
    PassportModule,
    DataServicesModule,
    HttpModule.register({
      maxBodyLength: MAX_BODY_LENGTH,
    }),
  ],
  controllers: [DexController, DexAdminController],
  providers: [DexService, DexAdminService],
})
export class DexModule {}
