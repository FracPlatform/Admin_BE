import {
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { IaoRequestService } from './iao-request.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FilterIAORequestDto } from './dto/filter-iao-request.dto';
import { ApiSuccessResponse } from 'src/common/response/api-success';

@Controller('iao-request')
@ApiTags('IAO Request')
export class IaoRequestController {
  constructor(private readonly iaoRequestService: IaoRequestService) {}

  @Get()
  @ApiOperation({ summary: 'List IAO request' })
  async findAll(@Query() filter: FilterIAORequestDto) {
    const data = await this.iaoRequestService.findAll(filter);
    return new ApiSuccessResponse().success(data, '');
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.iaoRequestService.findOne(+id);
  }

}
