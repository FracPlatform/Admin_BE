import { Module } from '@nestjs/common';
import { GasWalletService } from './gas-wallet.service';
import { GasWalletController } from './gas-wallet.controller';
import { DataServicesModule } from 'src/services';

@Module({
  imports: [DataServicesModule],
  controllers: [GasWalletController],
  providers: [GasWalletService],
})
export class GasWalletModule {}
