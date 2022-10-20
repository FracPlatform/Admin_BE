import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { DataServicesModule } from 'src/services';
import { DexController } from './dex.controller';
import { DexService } from './dex.service';
import { JwtStrategy } from './jwt.strategy';
import { DexAdminController } from './dex-admin.controller';
import { DexAdminService } from './dex-admin.service';
import { HttpModule } from "@nestjs/axios";

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_DEX_SECRET,
    }),
    DataServicesModule,
    HttpModule,
  ],
  controllers: [DexController, DexAdminController],
  providers: [DexService, JwtStrategy, DexAdminService],
})
export class DexModule {}
