import { Logger } from '@nestjs/common';
import { MAX_RETRY, MIMEType, TIME_WAIT_RETRY } from 'src/common/constants';
import { Utils } from 'src/common/utils';
import { IpfsNFTStorage } from './ipfs.nft-storage';
import { IpfsPinataCloud } from './ipfs.pinata-cloud';
import { IpfsSelfHost } from './ipfs.self-host';
import { IIPFS, IpfsClientType } from './ipfs.type';
import { IpfsWeb3Storage } from './ipfs.web3-storage';

export class IpfsGateway {
  private readonly logger = new Logger(IpfsGateway.name);

  private instance: IIPFS;

  constructor(ipfsClientType = IpfsClientType.SELF_HOST) {
    this.changeClientType(ipfsClientType);
  }

  private async changeClientType(ipfsClientType = undefined) {
    if (!ipfsClientType) {
      const ipfsClientTypes = process.env.IPFS_CLIENT_TYPE.split(',');
      ipfsClientType = Utils.getRandom(ipfsClientTypes);
    }
    if (ipfsClientType === IpfsClientType.SELF_HOST) {
      this.instance = new IpfsSelfHost();
    } else if (ipfsClientType === IpfsClientType.NFT_STORAGE) {
      this.instance = new IpfsNFTStorage();
    } else if (ipfsClientType === IpfsClientType.WEB3_STORAGE) {
      this.instance = new IpfsWeb3Storage();
    } else if (ipfsClientType === IpfsClientType.PINATA_CLOUD) {
      this.instance = new IpfsPinataCloud();
    } else {
      this.instance = new IpfsSelfHost();
    }
  }

  public async upload(content: Express.Multer.File) {
    this.logger.log(
      `upload(): Upload ipfs. client = ${this.instance.constructor.name}. file = ${content.fieldname}`,
    );
    let retry = 1;
    while (true) {
      try {
        return this.instance.upload(content);
      } catch (error) {
        this.changeClientType();
        this.logger.warn(`upload(): Retrying ${retry} time. ${error.message}`);
        retry++;
        if (retry > MAX_RETRY) {
          throw error;
        }
        await Utils.wait(TIME_WAIT_RETRY);
      }
    }
  }

  public async uploadFromURL(url: string, mimeType: any) {
    mimeType = mimeType || MIMEType.IMAGE_PNG;
    this.logger.log(
      `uploadFromURL(): Upload ipfs from URL. client = ${this.instance.constructor.name}. url = ${url}, mimeType = ${mimeType}`,
    );
    let retry = 1;
    while (true) {
      try {
        return this.instance.uploadFromURL(url, mimeType);
      } catch (error) {
        this.changeClientType();
        this.logger.warn(
          `uploadFromURL(): Retrying ${retry} time. ${error.message}`,
        );
        retry++;
        if (retry > MAX_RETRY) {
          throw error;
        }
        await Utils.wait(TIME_WAIT_RETRY);
      }
    }
  }
}
