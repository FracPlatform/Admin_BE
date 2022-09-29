import { Module } from '@nestjs/common';
import { IPFSController } from './ipfs.controller';
import { IpfsGateway } from './ipfs.gateway';

@Module({
  controllers: [IPFSController],
  providers: [IpfsGateway],
  exports: [IpfsGateway],
})
export class IPFSMofule {}
