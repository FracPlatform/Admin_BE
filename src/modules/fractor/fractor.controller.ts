import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiSuccessResponse } from '../../common/response/api-success';
import { FilterFractorDto } from './dto/filter-fractor.dto';
import { FractorService } from './fractor.service';

@Controller('fractor')
@ApiTags('Fractor User')
export class FractorController {
  constructor(private readonly fractorServices: FractorService) {}

  @Get()
  @ApiOperation({ summary: 'Filter fractors' })
  async filterFractor(@Query() filter: FilterFractorDto) {
    const data = await this.fractorServices.filterFractor(filter);
    return new ApiSuccessResponse().success(data, '');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get detail fractor' })
  async getDetail(
    @Param('id') fractorId: string
  ) {
    const data = await this.fractorServices.getFractorById(fractorId);
    return new ApiSuccessResponse().success(data, '')
  }
}
