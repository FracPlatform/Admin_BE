import { Logger } from '@nestjs/common';
import { ApiError } from 'src/common/api';
import { ErrorCode } from 'src/common/constants';
import { Utils } from 'src/common/utils';
import Web3Type from 'web3';
import { Contract } from 'web3-eth-contract';
import { IWeb3API } from './web3.type';
const Web3 = require('web3');
const abiDecoder = require('abi-decoder');
const contract721Abi = require('./contract/erc721.json');
const contract1155Abi = require('./contract/erc1155.json');
const contractProxyAbi = require('./contract/proxy.json');
const contract20Abi = require('./contract/erc20.json');
export class Web3ETH implements IWeb3API {
  private readonly logger = new Logger(Web3ETH.name);

  private web3Instance: Web3Type;
  private contract721: Contract;
  private contract1155: Contract;
  private contractProxy: Contract;
  private contract20: Contract;

  constructor() {
    if (!this.web3Instance) {
      this.web3Instance = new Web3();
    }
  }

  private async setProvider(contract20Address?: string) {
    while (true) {
      const rpcUrl = Utils.getRandom(process.env.CHAIN_RPC_URL.split(','));
      this.logger.debug(
        `setProvider(): ${this.web3Instance.currentProvider} -> ${rpcUrl}`,
      );
      this.web3Instance.setProvider(rpcUrl);
      const isSyncing = await this.web3Instance.eth.isSyncing();
      if (isSyncing === false) {
        break;
      }
      this.logger.warn(`setProvider(): ${rpcUrl} is syncing. Change RPC`);
      this.logger.debug(isSyncing);
    }

    this.contract721 = new this.web3Instance.eth.Contract(
      contract721Abi.output.abi,
      process.env.CONTRACT_ERC_721,
    );

    this.contract1155 = new this.web3Instance.eth.Contract(
      contract1155Abi.output.abi,
      process.env.CONTRACT_ERC_1155,
    );

    this.contractProxy = new this.web3Instance.eth.Contract(
      contractProxyAbi.output.abi,
      process.env.CONTRACT_PROXY,
    );

    if (contract20Address) {
      this.contract20 = new this.web3Instance.eth.Contract(
        contract20Abi.output.abi,
        contract20Address,
      );
    }

    abiDecoder.addABI(contractProxyAbi.output.abi);
  }

  private convertDataSign(data: any[]) {
    const dataSign: any = [];
    for (let index = 0; index < data.length; index++) {
      const value = data[index];
      if (typeof value === 'number') {
        dataSign.push({
          type: 'uint256',
          value: value,
        });
      } else if (typeof value === 'string') {
        if (this.web3Instance.utils.isAddress(value)) {
          dataSign.push({
            type: 'address',
            value: value,
          });
        } else if (value.startsWith('0x')) {
          dataSign.push({
            type: 'bytes',
            value: value,
          });
        } else {
          dataSign.push({
            type: 'bytes',
            value: Utils.convertToBytes(value),
          });
        }
      } else if (this.web3Instance.utils.isBigNumber(value)) {
        dataSign.push({
          type: 'uint256',
          value: value.toString(),
        });
      }
    }
    this.logger.debug('convertDataSign(): dataSign', JSON.stringify(dataSign));
    return dataSign;
  }

  public sign(data: any[], privateKey: string) {
    const dataSign = this.convertDataSign(data);
    const hash = this.web3Instance.utils.soliditySha3(...dataSign);
    const sign = this.web3Instance.eth.accounts.sign(hash, privateKey);
    this.logger.debug('sign(): sign', sign);
    return sign.signature;
  }

  public recover(data: any[], signature: string) {
    const dataSign = this.convertDataSign(data);
    const hash = this.web3Instance.utils.soliditySha3(...dataSign);
    return this.web3Instance.eth.accounts.recover(hash, signature);
  }

  public async getContractInstance() {
    await this.setProvider();
    return this.contractProxy;
  }

  public async getContract20Instance(contract20Address: string) {
    await this.setProvider(contract20Address);
    return this.contract20;
  }

  public toChecksumAddress(address: string) {
    try {
      return this.web3Instance.utils.toChecksumAddress(address, Number());
    } catch (error) {
      return address;
    }
  }

  public async getTransaction(hash: string) {
    await this.setProvider();
    return await this.web3Instance.eth.getTransaction(hash);
  }

  public async getTransactionReceipt(hash: string) {
    await this.setProvider();
    return await this.web3Instance.eth.getTransactionReceipt(hash);
  }

  public async balanceOf(address: string, tokenId: number) {
    await this.setProvider();
    if (tokenId) {
      return await this.contract1155.methods.balanceOf(address, tokenId).call();
    } else {
      return await this.contract721.methods.balanceOf(address).call();
    }
  }

  public async ownerOf(tokenId: number) {
    try {
      await this.setProvider();
      return await this.contract721.methods.ownerOf(tokenId).call();
    } catch (error) {
      if (error.toString().indexOf('owner query for nonexistent token') > -1) {
        throw ApiError(ErrorCode.INVALID_DATA, error.toString());
      }
      throw error;
    }
  }

  public async balanceOfBatch(address: string[], tokenIds: number[]) {
    await this.setProvider();
    return await this.contract1155.methods
      .balanceOfBatch(address, tokenIds)
      .call();
  }

  public async getLatestBlock() {
    await this.setProvider();
    const latestBlock = await this.web3Instance.eth.getBlockNumber();
    this.logger.debug(`getLatestBlock(): latestBlock`, latestBlock);
    return latestBlock;
  }

  public async getPastEvents721(
    event: string,
    fromBlock: number,
    toBlock: number,
  ) {
    await this.setProvider();
    const result = await this.contract721.getPastEvents(event, {
      fromBlock,
      toBlock,
    });
    this.logger.debug(`getPastEvents721(): result = ${JSON.stringify(result)}`);
    return result;
  }

  public async getPastEvents1155(
    event: string,
    fromBlock: number,
    toBlock: number,
  ) {
    await this.setProvider();
    const result = await this.contract1155.getPastEvents(event, {
      fromBlock,
      toBlock,
    });
    this.logger.debug(
      `getPastEvents1155(): result = ${JSON.stringify(result)}`,
    );
    return result;
  }

  public async getMethodByHash(hash: string) {
    await this.setProvider();
    const transaction = await this.getTransaction(hash);
    return abiDecoder.decodeMethod(transaction.input);
  }

  public async getEventByHash(hash: string) {
    await this.setProvider();
    const receipt = await this.web3Instance.eth.getTransactionReceipt(hash);
    if (
      receipt.to.toLowerCase() !== process.env.CONTRACT_EXCHANGE.toLowerCase()
    ) {
      this.logger.debug('getEventByHash(): receipt', receipt);
      throw ApiError(
        ErrorCode.INVALID_DATA,
        'The transaction is not from exchange contract',
      );
    }
    if (!receipt.status) {
      this.logger.debug('getEventByHash(): receipt', receipt);
      throw ApiError(
        ErrorCode.INVALID_DATA,
        'The transaction is not successful',
      );
    }
    return abiDecoder.decodeLogs(receipt.logs);
  }

  public async createAccount() {
    await this.setProvider();
    return await this.web3Instance.eth.accounts.create();
  }
}
