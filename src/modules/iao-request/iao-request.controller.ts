import { Controller, Get, Param, Query } from '@nestjs/common';
import { IaoRequestService } from './iao-request.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FilterIAORequestDto } from './dto/filter-iao-request.dto';
import { ApiSuccessResponse } from 'src/common/response/api-success';
import { ParseObjectIdPipe } from 'src/common/validation/parse-objectid.pipe';
import { ApiError } from 'src/common/api';

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

  @Get(':requestId')
  @ApiOperation({ summary: 'IAO request detail' })
  async findOne(@Param('requestId') requestId: string) {
    try {
      const data = await this.iaoRequestService.findOne(requestId);
      return new ApiSuccessResponse().success(data, '');
    } catch (error) {
      console.log(error);
      throw ApiError('', 'Get iao request detail error');
    }
  }
}
