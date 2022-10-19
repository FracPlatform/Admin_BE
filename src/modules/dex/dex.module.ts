import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { DataServicesModule } from 'src/services';
import { DexController } from './dex.controller';
import { DexService } from './dex.service';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_DEX_SECRET,
    }),
    DataServicesModule,
  ],
  controllers: [DexController],
  providers: [DexService, JwtStrategy],
})
export class DexModule {}
