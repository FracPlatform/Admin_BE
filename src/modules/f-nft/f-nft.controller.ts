import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '../auth/role.enum';
import { Roles } from '../auth/roles.decorator';
import { ApiSuccessResponse } from 'src/common/response/api-success';
import { GetUser } from '../auth/get-user.decorator';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { FnftService } from './f-nft.service';
import { ParseObjectIdPipe } from 'src/common/validation/parse-objectid.pipe';
import { CreateFnftDto, FilterFnftDto } from './dto/f-nft.dto';
@Controller('f-nft')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('F-nft')
export class FnftController {
  constructor(private readonly fnftService: FnftService) {}

  @Get()
  @Roles(Role.OperationAdmin, Role.SuperAdmin, Role.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Filter f-nfts' })
  async findAll(@GetUser() user, @Query() filter: FilterFnftDto) {
    const data = await this.fnftService.getListFnft(user, filter);
    return new ApiSuccessResponse().success(data, '');
  }

  @Get(':id')
  @Roles(Role.OperationAdmin, Role.SuperAdmin, Role.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'get Detail f-nft' })
  async getDetail(
    @Param('id', ParseObjectIdPipe) id: string,
    @GetUser() user,
  ) {
    const data = await this.fnftService.getDetail(id, user);
    return new ApiSuccessResponse().success(data, '');
  }

  @Post()
  @Roles(Role.SuperAdmin, Role.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create f-nft' })
  async createFnft(@Body() createFnftDto: CreateFnftDto, @GetUser() user) {
    const data = await this.fnftService.createFnft(user, createFnftDto);
    return new ApiSuccessResponse().success(data, '');
  }
}
