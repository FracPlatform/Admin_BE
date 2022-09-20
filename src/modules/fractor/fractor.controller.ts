import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiSuccessResponse } from '../../common/response/api-success';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Role } from '../auth/role.enum';
import { Roles } from '../auth/roles.decorator';
import { FilterFractorDto } from './dto/filter-fractor.dto';
import { UpdateFractorDto } from './dto/update-fractor.dto';
import { FractorService } from './fractor.service';

@Controller('fractor')
@ApiTags('Fractor User')
export class FractorController {
  constructor(private readonly fractorServices: FractorService) {}

  @Get()
  @ApiOperation({ summary: 'Filter fractors' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async filterFractor(@Query() filter: FilterFractorDto) {
    const data = await this.fractorServices.filterFractor(filter);
    return new ApiSuccessResponse().success(data, '');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get detail fractor' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getDetail(@Param('id') fractorId: string) {
    const data = await this.fractorServices.getFractorById(fractorId);
    return new ApiSuccessResponse().success(data, '');
  }

  @Put(':fractorId')
  @ApiOperation({ summary: 'Edit fractor' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.SuperAdmin, Role.OWNER, Role.HeadOfBD)
  async editFractorById(
    @Req() req,
    @Param('fractorId') fractorId: string,
    @Body() data: UpdateFractorDto,
  ) {
    const res = await this.fractorServices.editFractorById(
      req.user,
      fractorId,
      data,
    );
    return new ApiSuccessResponse().success(res, '');
  }
}
