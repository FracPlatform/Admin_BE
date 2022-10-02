import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { ApiError } from 'src/common/api';
import { ErrorCode } from 'src/common/constants';
import { IDataServices } from 'src/core/abstracts/data-services.abstract';
import { F_NFT_STATUS, IAOEvent, ON_CHAIN_STATUS } from 'src/datalayer/model';
import { CreateIaoEventDto } from './dto/create-iao-event.dto';
import { CreateWhitelistDto } from './dto/create-whilist.dto';
import { UpdateIaoEventDto } from './dto/update-iao-event.dto';
import { IaoEventBuilderService } from './iao-event.factory.service';
import { ethers } from 'ethers';

@Injectable()
export class IaoEventService {
  constructor(
    private readonly dataService: IDataServices,
    private readonly iaoEventBuilderService: IaoEventBuilderService,
    @InjectConnection() private readonly connection: mongoose.Connection,
  ) {}

  async createDraft(
    createIaoEventDto: CreateIaoEventDto,
    user: any,
  ): Promise<IAOEvent> {
    const fnft = await this.dataService.fnft.findOne({
      contractAddress: createIaoEventDto.FNFTcontractAddress,
      status: F_NFT_STATUS.ACTIVE,
    });
    if (!fnft) throw ApiError('E4', 'F-NFT not exists');

    const query: any = {
      $or: [
        {
          'iaoEventName.en': {
            $regex: createIaoEventDto.iaoEventName.en.trim(),
            $options: 'i',
          },
        },
      ],
    };

    if (createIaoEventDto.iaoEventName.cn)
      query['$or'].push({
        'iaoEventName.cn': {
          $regex: createIaoEventDto.iaoEventName.cn.trim(),
          $options: 'i',
        },
      });

    if (createIaoEventDto.iaoEventName.jp)
      query['$or'].push({
        'iaoEventName.jp': {
          $regex: createIaoEventDto.iaoEventName.jp.trim(),
          $options: 'i',
        },
      });

    const existsIAOEvent = await this.dataService.iaoEvent.findOne({
      ...query,
    });

    if (existsIAOEvent)
      throw ApiError('E9', 'Must be unique among list of IAO event name');

    createIaoEventDto['totalSupply'] = fnft.totalSupply;
    createIaoEventDto['iaoRequestId'] = fnft.iaoRequestId;
    
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const buildIAOEvent = await this.iaoEventBuilderService.createIAOEvent(
        createIaoEventDto,
        user,
        session,
      );

      const iaoEvent = await this.dataService.iaoEvent.create(
        buildIAOEvent,
        session,
      );
      await session.commitTransaction();

      return iaoEvent;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  findAll() {
    return `This action returns all iaoEvent`;
  }

  findOne(id: number) {
    return `This action returns a #${id} iaoEvent`;
  }

  update(id: number, updateIaoEventDto: UpdateIaoEventDto) {
    return `This action updates a #${id} iaoEvent`;
  }

  remove(id: number) {
    return `This action removes a #${id} iaoEvent`;
  }

  async createWhitelist(user, data: CreateWhitelistDto) {
    if (!data.whitelistAddresses.length)
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'whitelistAddresses is empty');

    const filter = { iaoEventId: data.iaoEventId, deleted: false };

    const currentIaoEvent = await this.dataService.iaoEvent.findOne(filter);
    if (!currentIaoEvent)
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'Id not already exists');

    if (currentIaoEvent.onChainStatus !== ON_CHAIN_STATUS.ON_CHAIN)
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'Status invalid');

    // check whitelist
    await this.checkWhitelist(data);

    return await this.dataService.iaoEvent.findOneAndUpdate(
      {
        ...filter,
        onChainStatus: ON_CHAIN_STATUS.ON_CHAIN,
        updatedAt: currentIaoEvent['updatedAt'],
      },
      {
        lastWhitelistUpdatedBy: user.adminId,
        lastWhitelistUpdatedAt: Date.now(),
        whitelist: data.whitelistAddresses,
      },
      { new: true },
    );
  }

  async checkWhitelist(data: CreateWhitelistDto) {
    //check duplicate
    let listAddress: any = [...new Set(data.whitelistAddresses)];

    //check incorrect
    for (const address of listAddress) {
      if (!ethers.utils.isAddress(address))
        throw ApiError(ErrorCode.DEFAULT_ERROR, 'Invalid wallet address');
    }

    data.whitelistAddresses = listAddress;
  }
}
