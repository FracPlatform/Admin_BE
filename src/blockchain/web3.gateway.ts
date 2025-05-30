import { Logger } from '@nestjs/common';
import { BlockChain, MAX_RETRY, TIME_WAIT_RETRY } from 'src/common/constants';
import { Utils } from 'src/common/utils';
import { Web3ETH } from './web3.eth';
import { IWeb3API } from './web3.type';

export class Web3Gateway {
  private readonly logger = new Logger(Web3Gateway.name);

  private instance: IWeb3API;
  private instances = new Map<number, IWeb3API>();

  constructor(chainId = undefined) {
    if (!chainId) {
      chainId = Number(process.env.CHAIN_ID);
    }
    if (!this.instances.has(chainId)) {
      const rpcs = this.getRPCByChainId(chainId);
      const web3 = new Web3ETH(rpcs);

      if (BlockChain.Network.BSC.includes(chainId)) {
        this.instances.set(chainId, web3);
      } else if (BlockChain.Network.ETH.includes(chainId)) {
        this.instances.set(chainId, web3);
      } else {
        throw new Error('Not support this chain');
      }
    }

    this.instance = this.instances.get(chainId);
  }

  private getRPCByChainId(chainId: number): string {
    if (BlockChain.Network.BSC.includes(chainId)) {
      return process.env.CHAIN_RPC_URL;
    }
    if (BlockChain.Network.ETH.includes(chainId)) {
      return process.env.CHAIN_RPC_ETH_URL;
    }
  }

  private isExceptionNeedRetry(error: Error) {
    if (
      error.toString().indexOf('CONNECTION ERROR') > -1 ||
      error.toString().indexOf('Invalid JSON RPC response') > -1 ||
      error.toString().indexOf('CONNECTION TIMEOUT') > -1 ||
      error.toString().indexOf('Maximum number of reconnect attempts reached') >
        -1 ||
      error.toString().indexOf('connection failure') > -1
    ) {
      return true;
    }
    return false;
  }

  public async sign(data: any[], privateKey: string) {
    let retry = 1;
    while (true) {
      try {
        return this.instance.sign(data, privateKey);
      } catch (error) {
        if (!this.isExceptionNeedRetry(error)) {
          throw error;
        }
        this.logger.warn(`sign(): Retrying ${retry} time. ${error.message}`);
        retry++;
        if (retry > MAX_RETRY) {
          throw error;
        }
        await Utils.wait(TIME_WAIT_RETRY);
      }
    }
  }

  public async recover(data: any[], signature: string) {
    let retry = 1;
    while (true) {
      try {
        return this.instance.recover(data, signature);
      } catch (error) {
        if (!this.isExceptionNeedRetry(error)) {
          throw error;
        }
        this.logger.warn(`recover(): Retrying ${retry} time. ${error.message}`);
        retry++;
        if (retry > MAX_RETRY) {
          throw error;
        }
        await Utils.wait(TIME_WAIT_RETRY);
      }
    }
  }

  public toChecksumAddress(address: string) {
    return this.instance.toChecksumAddress(address);
  }

  public async getTransaction(hash: string) {
    let retry = 1;
    while (true) {
      try {
        return await this.instance.getTransaction(hash);
      } catch (error) {
        if (!this.isExceptionNeedRetry(error)) {
          throw error;
        }
        this.logger.warn(
          `getTransaction(): Retrying ${retry} time. ${error.message}`,
        );
        retry++;
        if (retry > MAX_RETRY) {
          throw error;
        }
        await Utils.wait(TIME_WAIT_RETRY);
      }
    }
  }

  public async getTransactionReceipt(hash: string) {
    let retry = 1;
    while (true) {
      try {
        return await this.instance.getTransactionReceipt(hash);
      } catch (error) {
        if (!this.isExceptionNeedRetry(error)) {
          throw error;
        }
        this.logger.warn(
          `getTransactionReceipt(): Retrying ${retry} time. ${error.message}`,
        );
        retry++;
        if (retry > MAX_RETRY) {
          throw error;
        }
        await Utils.wait(TIME_WAIT_RETRY);
      }
    }
  }

  public async balanceOf(address: string, tokenId: number = null) {
    this.logger.log(
      `balanceOf(): Get balance of ${address}, tokenId = ${tokenId}`,
    );
    let retry = 1;
    while (true) {
      try {
        return Number(await this.instance.balanceOf(address, tokenId));
      } catch (error) {
        if (!this.isExceptionNeedRetry(error)) {
          throw error;
        }
        this.logger.warn(
          `balanceOf(): Retrying ${retry} time. ${error.message}`,
        );
        retry++;
        if (retry > MAX_RETRY) {
          throw error;
        }
        await Utils.wait(TIME_WAIT_RETRY);
      }
    }
  }

  public async ownerOf(tokenId: number) {
    this.logger.log(`balanceOf(): Get owner of ${tokenId}`);
    let retry = 1;
    while (true) {
      try {
        return await this.instance.ownerOf(tokenId);
      } catch (error) {
        if (!this.isExceptionNeedRetry(error)) {
          throw error;
        }
        this.logger.warn(`ownerOf(): Retrying ${retry} time. ${error.message}`);
        retry++;
        if (retry > MAX_RETRY) {
          throw error;
        }
        await Utils.wait(TIME_WAIT_RETRY);
      }
    }
  }

  public async balanceOfBatch(address: string[], tokenIds: number[]) {
    this.logger.log(
      `balanceOfBatch(): Get balance of ${address}, tokenId = ${tokenIds}`,
    );
    let retry = 1;
    while (true) {
      try {
        const balances = await this.instance.balanceOfBatch(address, tokenIds);
        return balances.map((obj) => Number(obj));
      } catch (error) {
        if (!this.isExceptionNeedRetry(error)) {
          throw error;
        }
        this.logger.warn(
          `balanceOfBatch(): Retrying ${retry} time. ${error.message}`,
        );
        retry++;
        if (retry > MAX_RETRY) {
          throw error;
        }
        await Utils.wait(TIME_WAIT_RETRY);
      }
    }
  }

  public async getLatestBlock() {
    let retry = 1;
    while (true) {
      try {
        return await this.instance.getLatestBlock();
      } catch (error) {
        if (!this.isExceptionNeedRetry(error)) {
          throw error;
        }
        this.logger.warn(
          `getLatestBlock(): Retrying ${retry} time. ${error.message}`,
        );
        retry++;
        if (retry > MAX_RETRY) {
          throw error;
        }
        await Utils.wait(TIME_WAIT_RETRY);
      }
    }
  }

  public async getPastEvents721(
    event: string,
    fromBlock: number,
    toBlock: number,
  ) {
    this.logger.log(
      `getPastEvents721(): Get past events 721 ${event} from block ${fromBlock} -> ${toBlock}`,
    );
    let retry = 1;
    while (true) {
      try {
        return await this.instance.getPastEvents721(event, fromBlock, toBlock);
      } catch (error) {
        if (!this.isExceptionNeedRetry(error)) {
          throw error;
        }
        this.logger.warn(
          `getPastEvents721(): Retrying ${retry} time. ${error.message}`,
        );
        retry++;
        if (retry > MAX_RETRY) {
          throw error;
        }
        await Utils.wait(TIME_WAIT_RETRY);
      }
    }
  }

  public async getPastEvents1155(
    event: string,
    fromBlock: number,
    toBlock: number,
  ) {
    this.logger.log(
      `getPastEvents1155(): Get past events 1155 ${event} from block ${fromBlock} -> ${toBlock}`,
    );
    let retry = 1;
    while (true) {
      try {
        return await this.instance.getPastEvents1155(event, fromBlock, toBlock);
      } catch (error) {
        if (!this.isExceptionNeedRetry(error)) {
          throw error;
        }
        this.logger.warn(
          `getPastEvents1155(): Retrying ${retry} time. ${error.message}`,
        );
        retry++;
        if (retry > MAX_RETRY) {
          throw error;
        }
        await Utils.wait(TIME_WAIT_RETRY);
      }
    }
  }

  public async getMethodByHash(hash: string) {
    let retry = 1;
    while (true) {
      try {
        return await this.instance.getMethodByHash(hash);
      } catch (error) {
        if (!this.isExceptionNeedRetry(error)) {
          throw error;
        }
        this.logger.warn(
          `getMethodByHash(): Retrying ${retry} time. ${error.message}`,
        );
        retry++;
        if (retry > MAX_RETRY) {
          throw error;
        }
        await Utils.wait(TIME_WAIT_RETRY);
      }
    }
  }

  public async getEventByHash(hash: string) {
    let retry = 1;
    while (true) {
      try {
        const events = await this.instance.getEventByHash(hash);
        if (!events || events.length === 0) {
          throw new Error('Event not found');
        }
        const obj = {
          name: events[0].name,
          address: events[0].address,
        };
        for (let index = 0; index < events[0].events.length; index++) {
          const event = events[0].events[index];
          obj[event.name] = event.value;
        }
        return obj;
      } catch (error) {
        if (!this.isExceptionNeedRetry(error)) {
          throw error;
        }
        this.logger.warn(
          `getEventByHash(): Retrying ${retry} time. ${error.message}`,
        );
        retry++;
        if (retry > MAX_RETRY) {
          throw error;
        }
        await Utils.wait(TIME_WAIT_RETRY);
      }
    }
  }

  public async createAccount() {
    let retry = 1;
    while (true) {
      try {
        return await this.instance.createAccount();
      } catch (error) {
        if (!this.isExceptionNeedRetry(error)) {
          throw error;
        }
        this.logger.warn(
          `createAccount(): Retrying ${retry} time. ${error.message}`,
        );
        retry++;
        if (retry > MAX_RETRY) {
          throw error;
        }
        await Utils.wait(TIME_WAIT_RETRY);
      }
    }
  }

  public async getBalance(wallet: string) {
    let retry = 1;
    while (true) {
      try {
        return await this.instance.getBalance(wallet);
      } catch (error) {
        if (!this.isExceptionNeedRetry(error)) {
          throw error;
        }
        this.logger.warn(
          `getBalance(): Retrying ${retry} time. ${error.message}`,
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
