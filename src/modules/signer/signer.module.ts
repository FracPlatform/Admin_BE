import { Module } from '@nestjs/common';
import { SignerService } from './signer.service';
import { SignerController } from './signer.controller';

@Module({
  controllers: [SignerController],
  providers: [SignerService]
})
export class SignerModule {}
