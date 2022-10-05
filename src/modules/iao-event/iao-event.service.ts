import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { ApiError } from 'src/common/api';
import { DEFAULT_LIMIT, DEFAULT_OFFET, ErrorCode } from 'src/common/constants';
import { IDataServices } from 'src/core/abstracts/data-services.abstract';
import {
  F_NFT_STATUS,
  IAOEvent,
  ON_CHAIN_STATUS,
  IAO_REQUEST_STATUS,
  IAO_EVENT_STATUS,
} from 'src/datalayer/model';
import { CreateIaoEventDto } from './dto/create-iao-event.dto';
import {
  CreateWhitelistDto,
  DeleteWhitelistDto,
  FilterWhitelistDto,
} from './dto/whitelist.dto';
import { UpdateIaoEventDto } from './dto/update-iao-event.dto';
import { IaoEventBuilderService } from './iao-event.factory.service';
import { ethers } from 'ethers';
import { CheckTimeDTO } from './dto/check-time.dto';
import { ListDocument } from '../iao-request/iao-request.service';

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
    // validate whitelistAnnouncementTime
    const date = createIaoEventDto.participationStartTime.toString();
    const participationEndTime = new Date(date);
    participationEndTime.setDate(
      participationEndTime.getDate() + createIaoEventDto.iaoEventDuration,
    );
    createIaoEventDto['participationEndTime'] = participationEndTime;
    if (createIaoEventDto.whitelistAnnouncementTime > participationEndTime)
      throw ApiError('E23', 'Must <= Participation_end_time');

    const fnft = await this.dataService.fnft.findOne({
      contractAddress: createIaoEventDto.FNFTcontractAddress,
      status: F_NFT_STATUS.ACTIVE,
    });
    if (!fnft) throw ApiError('E4', 'F-NFT not exists or deactive');

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

      return iaoEvent[0];
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

  async findOne(id: string) {
    const iaoEvent = await this.dataService.iaoEvent.findOne({
      iaoEventId: id,
      isDeleted: false,
    });
    if (!iaoEvent) throw ApiError('', 'This IAO event not exists');

    const fnft: any = await this.dataService.fnft.findOne({
      contractAddress: iaoEvent.FNFTcontractAddress,
      deleted: false,
      status: F_NFT_STATUS.ACTIVE,
    });

    if (!fnft) throw ApiError('', 'F-NFT of This IAO event not exists');

    const iaoRequest: any = await this.dataService.iaoRequest.findOne({
      iaoId: fnft.iaoRequestId,
      deleted: false,
      status: IAO_REQUEST_STATUS.APPROVED_B,
    });

    if (iaoRequest) {
      // get name of fractor
      const fractor = await this.dataService.fractor.findOne(
        {
          fractorId: iaoRequest.ownerId,
        },
        { fullname: 1, assignedBD: 1 },
      );
      iaoRequest.fractor = fractor.fullname;
      // get name of BD
      const bd = await this.dataService.admin.findOne(
        {
          adminId: fractor.assignedBD,
        },
        { fullname: 1 },
      );
      iaoRequest.bd = bd?.fullname ? bd.fullname : null;
      // get url of items
      const itemsId = iaoRequest.items.map((i) => {
        return { itemId: i };
      });
      const items: any = await this.dataService.asset.findMany(
        {
          $or: itemsId,
        },
        { itemId: 1, name: 1, media: 1, _id: 0 },
      );
      iaoRequest.itemObject = items;
      // get NFT
      const nftId = fnft.items.map((i) => {
        return { tokenId: i };
      });
      const nfts = await this.dataService.nft.findMany(
        { $or: nftId },
        { name: 1, tokenId: 1, status: 1, assetId: 1 },
      );
      fnft.items = nfts;
      //other info
      const getCreatedBy = this.dataService.admin.findOne(
        {
          adminId: iaoEvent.createdBy,
        },
        { fullname: 1 },
      );
      const getUpdatedBy = this.dataService.admin.findOne(
        {
          adminId: iaoEvent.updatedBy,
        },
        { fullname: 1 },
      );
      const getLastWhitelistUpdatedBy = this.dataService.admin.findOne(
        {
          adminId: iaoEvent.lastWhitelistUpdatedBy,
        },
        { fullname: 1 },
      );
      const [createdBy, updatedBy, lastWhitelistUpdatedBy] = await Promise.all([
        getCreatedBy,
        getUpdatedBy,
        getLastWhitelistUpdatedBy,
      ]);
      iaoEvent.createdBy = createdBy?.fullname;
      iaoEvent.updatedBy = updatedBy?.fullname;
      iaoEvent.lastWhitelistUpdatedBy = lastWhitelistUpdatedBy?.fullname;

      const createdOnChainBy = await this.dataService.admin.findOne(
        {
          adminId: iaoEvent.createdOnChainBy,
        },
        { fullname: 1 },
      );
      iaoEvent.createdOnChainBy = createdOnChainBy?.fullname
        ? createdOnChainBy.fullname
        : null;
    }

    const iaoEventDetail = this.iaoEventBuilderService.getIaoEventDetail(
      iaoEvent,
      fnft,
      iaoRequest,
    );

    return iaoEventDetail;
  }

  async updateIaoDraft(
    id: string,
    updateIaoEventDto: UpdateIaoEventDto,
    user: any,
  ) {
    const iaoEvent = await this.dataService.iaoEvent.findOne({
      iaoEventId: id,
      isDeleted: false,
      onChainStatus: ON_CHAIN_STATUS.DRAFT,
    });
    if (!iaoEvent) throw ApiError('', 'Data not exists');
    const iaoEventToUpdate = this.iaoEventBuilderService.updateIaoEventDetail(
      updateIaoEventDto,
      user,
    );
    const update = await this.dataService.iaoEvent.updateOne(
      {
        iaoEventId: id,
        isDeleted: false,
        onChainStatus: ON_CHAIN_STATUS.DRAFT,
      },
      {
        $set: {
          ...iaoEventToUpdate,
        },
      },
    );
    if (update.modifiedCount === 0)
      throw ApiError('', 'Cannot update this IAO event');
    return id;
  }

  async updateIaoOnChain(
    id: string,
    updateIaoEventDto: UpdateIaoEventDto,
    user: any,
  ) {
    const iaoEvent = await this.dataService.iaoEvent.findOne({
      iaoEventId: id,
      isDeleted: false,
      onChainStatus: ON_CHAIN_STATUS.ON_CHAIN,
      status: IAO_EVENT_STATUS.ACTIVE,
    });
    if (!iaoEvent) throw ApiError('', 'Data not exists');
    const iaoEventToUpdate = this.iaoEventBuilderService.updateIaoOnChain(
      updateIaoEventDto,
      user,
    );
    const update = await this.dataService.iaoEvent.updateOne(
      {
        iaoEventId: id,
        isDeleted: false,
        onChainStatus: ON_CHAIN_STATUS.ON_CHAIN,
        status: IAO_EVENT_STATUS.ACTIVE,
      },
      {
        $set: {
          ...iaoEventToUpdate,
        },
      },
    );
    return id;
  }

  async remove(id: string, user: any) {
    const iaoEvent = await this.dataService.iaoEvent.findOne({
      iaoEventId: id,
      isDeleted: false,
      onChainStatus: ON_CHAIN_STATUS.DRAFT,
    });
    if (!iaoEvent) throw ApiError('', 'Data no exists');
    const update = await this.dataService.iaoEvent.updateOne(
      {
        iaoEventId: id,
        isDeleted: false,
        onChainStatus: ON_CHAIN_STATUS.DRAFT,
      },
      { $set: { isDeleted: true, isDisplay: false, updatedBy: user.adminId } },
    );
    if (update.modifiedCount === 0)
      throw ApiError('', 'Cannot delete this IAO event');
    return id;
  }

  async getListWhitelist(user: any, filter: FilterWhitelistDto) {
    const currertWhitelist = await this.dataService.whitelist.findOne({
      iaoEventId: filter.iaoEventId,
      deleted: false,
    });
    if (!currertWhitelist)
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'iaoEventId not already exists');

    const totalAddress = currertWhitelist.whiteListAddresses.length;

    // search data
    const dataRegex = new RegExp(filter.wallet, 'i');
    let whiteListAddresses = currertWhitelist.whiteListAddresses.filter((i) =>
      dataRegex.test(i.walletAddress),
    );

    // sort deposited
    if (filter.sortField && filter.sortType) {
      whiteListAddresses = whiteListAddresses.sort((n1, n2) => {
        if (n1[filter.sortField] > n2[filter.sortField]) {
          return filter.sortType;
        }

        if (n1[filter.sortField] < n2[filter.sortField]) {
          return -filter.sortType;
        }

        return 0;
      });
    }

    // offset && limit
    whiteListAddresses = whiteListAddresses.slice(
      filter.offset || DEFAULT_OFFET,
      filter.limit || DEFAULT_LIMIT,
    );

    return {
      totalDocs: totalAddress,
      docs: whiteListAddresses || [],
    } as ListDocument;
  }

  async createWhitelist(user, data: CreateWhitelistDto) {
    if (!data.whitelistAddresses.length)
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'whitelistAddresses is empty');

    // check Iao-event
    await this.checkIaoEvent(data.iaoEventId);

    // check iaoEventId in whitelist
    const isIaoEventId = await this.dataService.whitelist.findOne({
      iaoEventId: data.iaoEventId,
      deleted: false,
    });
    if (isIaoEventId)
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'iaoEventId already exists');

    // check whitelist
    await this.checkAddressInWhitelist(data);

    return await this.dataService.whitelist.create({
      iaoEventId: data.iaoEventId,
      whiteListAddresses: data.whitelistAddresses,
      deleted: false,
    });
  }

  async checkIaoEvent(iaoEventId: string) {
    const filter = { iaoEventId, deleted: false };

    const currentIaoEvent = await this.dataService.iaoEvent.findOne(filter);
    if (!currentIaoEvent)
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'Id not already exists');

    if (currentIaoEvent.whitelistAnnouncementTime.getTime() <= Date.now())
      throw ApiError(ErrorCode.DEFAULT_ERROR, 'Now > Participation start time');
  }

  async checkAddressInWhitelist(data: CreateWhitelistDto) {
    const listWalletAddress = [];

    for (const [i, obj] of data.whitelistAddresses.entries()) {
      // check duplicate
      const isAddress = listWalletAddress.find(
        (e) => e === obj['walletAddress'],
      );
      if (isAddress) {
        data.whitelistAddresses.splice(i, 1);
      }

      //check incorrect
      if (!ethers.utils.isAddress(obj['walletAddress']))
        throw ApiError(ErrorCode.DEFAULT_ERROR, 'Invalid wallet address');

      listWalletAddress.push(obj['walletAddress']);
    }
  }

  async removeWhitelist(
    iaoEventId: string,
    user: any,
    data: DeleteWhitelistDto,
  ) {
    // check Iao-event
    await this.checkIaoEvent(iaoEventId);

    const filter = { iaoEventId, deleted: false };
    const option = {};

    if (data.isClearAll) {
      option['deleted'] = true;
    } else {
      if (!data.walletAddress)
        throw ApiError(
          ErrorCode.DEFAULT_ERROR,
          'walletAddress should not be empty',
        );

      filter['whiteListAddresses.walletAddress'] = data.walletAddress;
      option['$pull'] = {
        whiteListAddresses: { walletAddress: data.walletAddress },
      };
    }

    //delete a record or all
    return await this.dataService.whitelist.updateOne(filter, option);
  }

  async checkRegistrationParticipation(
    checkTimeDTO: CheckTimeDTO,
  ): Promise<Array<IAOEvent>> {
    const query = { $or: [] };
    // check with registrationStartTime
    query['$or'].push(
      {
        registrationStartTime: {
          $lte: checkTimeDTO.date,
          $gte: checkTimeDTO.date.setHours(
            checkTimeDTO.date.getHours() -
              Number(process.env.IAO_EVENT_CHECK_HOURS),
          ),
        },
      },
      {
        registrationStartTime: {
          $gte: checkTimeDTO.date,
          $lte: checkTimeDTO.date.setHours(
            checkTimeDTO.date.getHours() +
              Number(process.env.IAO_EVENT_CHECK_HOURS),
          ),
        },
      },
    );
    // check with registrationEndTime
    query['$or'].push(
      {
        registrationEndTime: {
          $lte: checkTimeDTO.date,
          $gte: checkTimeDTO.date.setHours(
            checkTimeDTO.date.getHours() -
              Number(process.env.IAO_EVENT_CHECK_HOURS),
          ),
        },
      },
      {
        registrationEndTime: {
          $gte: checkTimeDTO.date,
          $lte: checkTimeDTO.date.setHours(
            checkTimeDTO.date.getHours() +
              Number(process.env.IAO_EVENT_CHECK_HOURS),
          ),
        },
      },
    );
    // check with participationStartTime
    query['$or'].push(
      {
        participationStartTime: {
          $lte: checkTimeDTO.date,
          $gte: checkTimeDTO.date.setHours(
            checkTimeDTO.date.getHours() -
              Number(process.env.IAO_EVENT_CHECK_HOURS),
          ),
        },
      },
      {
        participationStartTime: {
          $gte: checkTimeDTO.date,
          $lte: checkTimeDTO.date.setHours(
            checkTimeDTO.date.getHours() +
              Number(process.env.IAO_EVENT_CHECK_HOURS),
          ),
        },
      },
    );
    // check with participationEndTime
    query['$or'].push(
      {
        participationEndTime: {
          $lte: checkTimeDTO.date,
          $gte: checkTimeDTO.date.setHours(
            checkTimeDTO.date.getHours() -
              Number(process.env.IAO_EVENT_CHECK_HOURS),
          ),
        },
      },
      {
        participationEndTime: {
          $gte: checkTimeDTO.date,
          $lte: checkTimeDTO.date.setHours(
            checkTimeDTO.date.getHours() +
              Number(process.env.IAO_EVENT_CHECK_HOURS),
          ),
        },
      },
    );

    const iaoEventList = await this.dataService.iaoEvent.findMany({
      ...query,
      status: IAO_EVENT_STATUS.ACTIVE,
    });
    return iaoEventList;
  }
}
