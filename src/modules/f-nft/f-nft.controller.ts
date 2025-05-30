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
import {
  CheckExistsDto,
  CreateFnftDto,
  FilterFnftDto,
  UpdateFnftDto,
} from './dto/f-nft.dto';
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

  @Get('/check-exists')
  @Roles(Role.SuperAdmin, Role.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check exists' })
  async checkExists(@GetUser() user, @Query() filter: CheckExistsDto) {
    const data = await this.fnftService.checkExists(user, filter);
    return new ApiSuccessResponse().success(data, '');
  }

  @Get(':id')
  @Roles(Role.OperationAdmin, Role.SuperAdmin, Role.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'get Detail f-nft' })
  async getDetail(@Param('id') id: string) {
    const data = await this.fnftService.getDetail(id);
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

  @Put(':id')
  @Roles(Role.SuperAdmin, Role.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Edit f-nft' })
  async update(
    @Param('id') id: string,
    @Body() updateFnftDto: UpdateFnftDto,
    @GetUser() user,
  ) {
    const response = await this.fnftService.update(id, user, updateFnftDto);
    return new ApiSuccessResponse().success(response, '');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete Fnft when mintedStatus = process' })
  @ApiBearerAuth()
  @Roles(Role.SuperAdmin, Role.OWNER)
  async deleteFnft(@GetUser() user, @Param('id') id: string) {
    const responseData = await this.fnftService.deleteFnftDraft(user, id);
    return new ApiSuccessResponse().success(responseData, '');
  }
}
