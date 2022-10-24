import { Logger } from '@nestjs/common';
import ObjectID from 'bson-objectid';
import { Types } from 'mongoose';
const CryptoJS = require('crypto-js');
import BigNumber from 'bignumber.js';
import { PagingDocument } from './common-type';
import { ErrorCode } from './constants';
import { ApiError } from './api';
import { AwsUtils } from './aws.util';
import mongoose from 'mongoose';
import { IGenericRepository } from '../core/abstracts/generic-repository.abstract';
import { CounterId } from '../datalayer/model';
import { Web3ETH } from 'src/blockchain/web3.eth';
import moment = require('moment');
const jwt = require('jsonwebtoken');
const { URL, parse } = require('url');
export class Utils {
  private static readonly logger = new Logger(Utils.name);

  /**
   * Check string is Mongo ObjectId
   * @param {string} str
   * @return {boolean}
   */
  public static isObjectId(str: string) {
    try {
      new Types.ObjectId(str);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Convert string to Mongo ObjectId
   * @param {any} str
   * @return {Types.ObjectId}
   */
  public static toObjectId(str: any) {
    try {
      return new Types.ObjectId(str);
    } catch (error) {
      throw ApiError(ErrorCode.INVALID_DATA, error.message);
    }
  }

  /**
   * Create mongodb id
   * @return {Types.ObjectId}
   */
  public static createObjectId() {
    return new Types.ObjectId(new ObjectID());
  }

  /**
   * Convert array string to array Mongo ObjectId
   * @param {string[]} strs
   * @return {Types.ObjectId[]}
   */
  public static toObjectIds(strs: string[]) {
    return strs.map((str) => this.toObjectId(str));
  }

  /**
   * Convert array object to array string
   * @param {any[]} listObject
   * @param {string} field
   * @return {string[]}
   */
  public static toListString(listObject: any[]) {
    return listObject.map((obj) => obj.toString());
  }

  /**
   * Convert price
   * @param {any} value
   * @param {number} coinDecimal
   * @return {any}
   */
  public static convertPrice(value: any, coinDecimal = 18) {
    BigNumber.config({
      EXPONENTIAL_AT: 100,
    });
    return new BigNumber(value).multipliedBy(
      new BigNumber(Math.pow(10, coinDecimal)),
    );
  }

  /**
   * Get random element from array
   * @param {any[]} array
   * @return {any}
   */
  public static getRandom(array: any[]) {
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Wait
   * @param {number} ms
   * @return {Promise}
   */
  public static wait(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  /**
   * Retry a promoise function
   * @param {any} operation
   * @param {number} retries
   * @param {number} delay
   * @return {Promise<any>}
   */
  public static retryFn(operation, retries = 3, delay = 500) {
    return new Promise((resolve, reject) => {
      return operation()
        .then(resolve)
        .catch((reason) => {
          if (retries > 0) {
            return Utils.wait(delay)
              .then(this.retryFn.bind(null, operation, retries - 1, delay))
              .then(resolve)
              .catch(reject);
          }
          return reject(reason);
        });
    });
  }

  /**
   * Encrypt
   * @param {string} str
   * @return {string}
   */
  public static async encrypt(str) {
    if (process.env.NODE_ENV === 'dev') {
      return CryptoJS.AES.encrypt(str, process.env.CRYPTO_SECRET).toString();
    } else {
      return AwsUtils.encrypt(str);
    }
  }

  public static encryptUserPassword(password: string) {
    return CryptoJS.MD5(password).toString();
  }

  /**
   * Decrypt
   * @param {string} str
   * @return {string}
   */
  public static decrypt(str) {
    if (process.env.NODE_ENV === 'dev') {
      const bytes = CryptoJS.AES.decrypt(str, process.env.CRYPTO_SECRET);
      return bytes.toString(CryptoJS.enc.Utf8);
    } else {
      return AwsUtils.decrypt(str);
    }
  }

  /**
   * Get user from header
   * @param {Request} req
   * @return {UserJWT}
   */
  public static async getUser(req: Request) {
    try {
      if (
        req.headers['authorization'] &&
        req.headers['authorization'].split(' ')[0] === 'Bearer'
      ) {
        const jwtToken = req.headers['authorization'].split(' ')[1];
        return jwt.verify(jwtToken, process.env.JWT_SECRET);
      }
    } catch (error) {
      return null;
    }
  }
  /**
   * Convert string to bytes
   * @param {string} str
   * @return {string}
   */
  public static convertToBytes(str: string) {
    return '0x' + str;
  }

  /**
   * Convert bytes to bytes
   * @param {string} str
   * @return {string}
   */
  public static convertBytesToString(str: string) {
    return str.substring(2);
  }

  /**
   * Paginate
   * @param {any} model
   * @param {any} match
   * @param {any} query
   * @return {Promise<PagingDocument>}
   */
  public static paginate(model: any, match: any, query: any) {
    this.logger.debug('paginate(): match', JSON.stringify(match));
    const pagingOptions: any = {
      page: query.page,
      limit: query.limit,
      sort: query.sort ? query.sort : { createdAt: 'desc' },
    };
    if (query.projection) {
      pagingOptions.projection = {};
      for (const [key, value] of Object.entries(query.projection)) {
        if (value.toString() !== '0' && value.toString() !== '1') {
          continue;
        }
        pagingOptions.projection[key] = Number(value);
      }
    }
    this.logger.debug(
      'paginate(): pagingOptions',
      JSON.stringify(pagingOptions),
    );
    return model.paginate(match, pagingOptions) as Promise<PagingDocument>;
  }

  /**
   * Paginate
   * @param {any} model
   * @param {any} pipe
   * @param {any} query
   * @return {Promise<PagingDocument>}
   */
  public static aggregatePaginate(model: any, pipe: any, query: any) {
    this.logger.debug('aggregatePaginate(): match', JSON.stringify(pipe));
    const pagingOptions: any = {
      page: query.page,
      limit: query.limit,
      sort: query.sort ? query.sort : { createdAt: 'desc' },
    };
    if (query.projection) {
      pagingOptions.projection = query.projection;
    }
    return model.aggregatePaginate(
      model.aggregate(pipe),
      pagingOptions,
    ) as Promise<PagingDocument>;
  }

  public static isValidateHash(hash) {
    return /^0x([A-Fa-f0-9]{64})$/.test(hash);
  }

  public static async countAggregation(model: any, pipe: any) {
    const aggregate = await model.aggregate([
      ...pipe,
      {
        $count: 'count',
      },
    ]);
    return aggregate.length ? aggregate[0].count : 0;
  }

  /**
   * Get wallet address in short format: �[6 first digits]�[4 last digits]�
   * @param {string} address
   * @return {string}
   */
  public static getShortAddress(address: string) {
    if (address.length <= 10) return address;
    return address.slice(0, 6) + '...' + address.slice(-4);
  }

  /**
   * the async version of arr.filter
   * @param {Array} arr
   * @param {Function} predicate
   * @return {Array}
   */
  public static async asyncFilter(arr, predicate) {
    const results = await Promise.all(arr.map(predicate));
    return arr.filter((_v, index) => results[index]);
  }

  public static isEmpty(str) {
    return !str || str.length === 0;
  }

  public static isParamExists(param) {
    return param !== undefined ? true : false;
  }

  public static toDecimal(str: any) {
    return mongoose.Types.Decimal128.fromString(str.toString());
  }

  public static stringIsAValidUrl = (s, protocols) => {
    try {
      new URL(s);
      const parsed = parse(s);
      return protocols
        ? parsed.protocol
          ? protocols
              .map((x) => `${x.toLowerCase()}:`)
              .includes(parsed.protocol)
          : false
        : true;
    } catch (err) {
      return false;
    }
  };

  public static async getNextPrefixId(
    counterRepository: IGenericRepository<CounterId>,
    prefix,
    session,
  ) {
    const res = await counterRepository.findOneAndUpdate(
      { _id: prefix },
      { $inc: { sequenceValue: 1 } },
      { new: true, session: session },
    );
    return `${prefix}-${res.sequenceValue}`;
  }

  public static escapeRegex(string) {
    return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  }

  public static async getNftContractAddress() {
    const contractProxy = await new Web3ETH().getContractInstance();
    const nftContractAddress = await contractProxy.methods
      .token721Address()
      .call();
    return nftContractAddress;
  }

  public static formatDate(date: Date) {
    return moment(date).format('MM/DD/YYYY HH:mm:ss');
  }

  public static addDateByHour(date: Date, hours: number): Date {
    const copyDate = new Date(date);
    return new Date(copyDate.setHours(copyDate.getHours() + hours));
  }

  public static subtractDateByHour(date: Date, hours: number): Date {
    const copyDate = new Date(date);
    return new Date(copyDate.setHours(copyDate.getHours() - hours));
  }

  public static async getCurrencySymbol(currencyAddress) {
    const contract20 = await new Web3ETH().getContract20Instance(
      currencyAddress,
    );
    const currencySymbol = await contract20.methods.symbol().call();
    const currencyDecimal = await contract20.methods.decimals().call();
    return { currencySymbol, currencyDecimal };
  }

}
