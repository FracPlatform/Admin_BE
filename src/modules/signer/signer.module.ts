import { Module } from '@nestjs/common';
import { SignerService } from './signer.service';
import { SignerController } from './signer.controller';
import { DataServicesModule } from 'src/services';

@Module({
  imports: [DataServicesModule],
  controllers: [SignerController],
  providers: [SignerService],
})
export class SignerModule {}
