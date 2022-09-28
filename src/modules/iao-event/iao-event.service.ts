import { Injectable } from '@nestjs/common';
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

    if (fnft.iaoRequestId !== createIaoEventDto.iaoRequestId)
      throw ApiError('E4', 'F-NFT and IAO request ID not match');

    if (fnft.totalSupply !== createIaoEventDto.totalSupply)
      throw ApiError('E4', 'Total supply is not match');

    const existsIAOEvent = await this.dataService.iaoEvent.findOne({
      $or: [
        {
          iaoEventName: {
            $regex: createIaoEventDto.iaoEventName.en.trim(),
            $options: 'i',
          },
        },
        {
          iaoEventName: {
            $regex: createIaoEventDto.iaoEventName.jp.trim(),
            $options: 'i',
          },
        },
        {
          iaoEventName: {
            $regex: createIaoEventDto.iaoEventName.cn.trim(),
            $options: 'i',
          },
        },
      ],
    });

    if (existsIAOEvent)
      throw ApiError('E9', 'Must be unique among list of IAO event name');

    const buildIAOEvent = this.iaoEventBuilderService.createIAOEvent(
      createIaoEventDto,
      user,
    );

    const iaoEvent = await this.dataService.iaoEvent.create(buildIAOEvent);

    return iaoEvent;
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
