import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiSuccessResponse } from '../../common/response/api-success';
import { GetUser } from '../auth/get-user.decorator';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Role } from '../auth/role.enum';
import { Roles } from '../auth/roles.decorator';
import { DeactiveDto } from './dto/active-deactive-fractor.dto';
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
  async filterFractor(@GetUser() user, @Query() filter: FilterFractorDto) {
    const data = await this.fractorServices.filterFractor(user, filter);
    return new ApiSuccessResponse().success(data, '');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get detail fractor' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getDetail(@GetUser() user, @Param('id') fractorId: string) {
    const data = await this.fractorServices.getFractorById(user, fractorId);
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

  @Post('deactive/:fractorId')
  @ApiOperation({ summary: 'Deactive fractor' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.SuperAdmin, Role.OWNER)
  async deactiveFractor(
    @Req() req,
    @Param('fractorId') fractorId: string,
    @Body() data: DeactiveDto,
  ) {
    const res = await this.fractorServices.deactiveFractor(
      req.user,
      fractorId,
      data,
    );
    return new ApiSuccessResponse().success(res, '');
  }

  @Post('active/:fractorId')
  @ApiOperation({ summary: 'active fractor' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.SuperAdmin, Role.OWNER)
  async activeFractor(@Req() req, @Param('fractorId') fractorId: string) {
    const res = await this.fractorServices.activeFractor(req.user, fractorId);
    return new ApiSuccessResponse().success(res, '');
  }
}
