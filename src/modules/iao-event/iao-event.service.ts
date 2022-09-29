import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { ApiError } from 'src/common/api';
import { IDataServices } from 'src/core/abstracts/data-services.abstract';
import { F_NFT_STATUS, IAOEvent } from 'src/datalayer/model';
import { CreateIaoEventDto } from './dto/create-iao-event.dto';
import { UpdateIaoEventDto } from './dto/update-iao-event.dto';
import { IaoEventBuilderService } from './iao-event.factory.service';

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
}
