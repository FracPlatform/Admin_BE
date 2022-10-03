import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Put,
} from '@nestjs/common';
import { IaoEventService } from './iao-event.service';
import { CreateIaoEventDto } from './dto/create-iao-event.dto';
import { UpdateIaoEventDto } from './dto/update-iao-event.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { Request } from 'express';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';
import { ApiSuccessResponse } from 'src/common/response/api-success';
import { GetUser } from '../auth/get-user.decorator';
import { CreateWhitelistDto } from './dto/create-whilist.dto';

@Controller('iao-event')
@ApiTags('IAO Event')
export class IaoEventController {
  constructor(private readonly iaoEventService: IaoEventService) {}

  @Post('/draft')
  @ApiOperation({ summary: 'Create IAO event as draft' })
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles(Role.OperationAdmin, Role.SuperAdmin, Role.OWNER)
  async createDraft(
    @Body() createIaoEventDto: CreateIaoEventDto,
    @Req() req: Request,
  ) {
    try {
      const iaoEvent = await this.iaoEventService.createDraft(
        createIaoEventDto,
        req.user,
      );
      return new ApiSuccessResponse().success(iaoEvent, '');
    } catch (error) {
      throw error;
    }
  }

  @Post('/whitelist')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.OperationAdmin, Role.SuperAdmin, Role.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a whitelist"' })
  async createWhitelist(
    @Body() createWhitelistDto: CreateWhitelistDto,
    @GetUser() user,
  ) {
    const data = await this.iaoEventService.createWhitelist(
      user,
      createWhitelistDto,
    );
    return new ApiSuccessResponse().success(data, '');
  }

  @Get()
  findAll() {
    return this.iaoEventService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'get IAO event detail' })
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles(Role.OperationAdmin, Role.SuperAdmin, Role.OWNER)
  async findOne(@Param('id') id: string) {
    try {
      const iaoEvent = await this.iaoEventService.findOne(id);
      return new ApiSuccessResponse().success(iaoEvent, '');
    } catch (error) {
      throw error;
    }
  }

  @Put(':id/draft')
  @ApiOperation({ summary: 'update IAO event as draft' })
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles(Role.OperationAdmin, Role.SuperAdmin, Role.OWNER)
  async updateIaoDraft(
    @Param('id') id: string,
    @Body() updateIaoEventDto: UpdateIaoEventDto,
    @Req() req: Request,
  ) {
    try {
      const iaoEventId = await this.iaoEventService.updateIaoDraft(
        id,
        updateIaoEventDto,
        req.user,
      );
      return new ApiSuccessResponse().success(iaoEventId, '');
    } catch (error) {
      throw error;
    }
  }

  @Put(':id/onchain')
  @ApiOperation({ summary: 'update IAO OnChain' })
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles(Role.OperationAdmin, Role.SuperAdmin, Role.OWNER)
  async updateIaoOnChain(
    @Param('id') id: string,
    @Body() updateIaoEventDto: UpdateIaoEventDto,
    @Req() req: Request,
  ) {
    try {
      const iaoEventId = await this.iaoEventService.updateIaoOnChain(
        id,
        updateIaoEventDto,
        req.user,
      );
      return new ApiSuccessResponse().success(iaoEventId, '');
    } catch (error) {
      throw error;
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete IAO event' })
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles(Role.OperationAdmin, Role.SuperAdmin, Role.OWNER)
  async remove(@Param('id') id: string, @Req() req: Request) {
    try {
      const iaoEventId = await this.iaoEventService.remove(id, req.user);
      return new ApiSuccessResponse().success(iaoEventId, '');
    } catch (error) {
      throw error;
    }
  }
}
