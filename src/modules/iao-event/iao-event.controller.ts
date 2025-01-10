import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Put,
  Query,
  Res,
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
import {
  CreateWhitelistDto,
  DeleteWhitelistDto,
  FilterWhitelistDto,
  ExportWhitelistDto,
} from './dto/whitelist.dto';
import { CheckTimeDTO } from './dto/check-time.dto';
import { RolesGuard } from '../auth/guard/roles.guard';
import { GetListIaoEventDto } from './dto/get-list-iao-event.dto';
import { CalenderDTO } from './dto/calendar.dto';

@Controller('iao-event')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('IAO Event')
export class IaoEventController {
  constructor(private readonly iaoEventService: IaoEventService) {}

  @Post('/draft')
  @ApiOperation({ summary: 'Create IAO event as draft' })
  @HttpCode(HttpStatus.OK)
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

  @Get('/whitelist')
  @Roles(Role.OperationAdmin, Role.SuperAdmin, Role.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Filter whitelist' })
  async getListWhitelist(@GetUser() user, @Query() filter: FilterWhitelistDto) {
    const data = await this.iaoEventService.getListWhitelist(user, filter);
    return new ApiSuccessResponse().success(data, '');
  }

  @Get('/export-whitelist')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OperationAdmin, Role.SuperAdmin, Role.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Export whitelist' })
  async exportWhitelist(
    @Res() res: Response,
    @GetUser() user,
    @Query() filter: ExportWhitelistDto,
  ) {
    const data = await this.iaoEventService.exportWhitelist(res, user, filter);
    return new ApiSuccessResponse().success(data, '');
  }

  @Post('/whitelist')
  @Roles(Role.OperationAdmin, Role.SuperAdmin, Role.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a whitelist' })
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

  @Delete('/whitelist/:iaoEventId')
  @Roles(Role.OperationAdmin, Role.SuperAdmin, Role.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Edit record or all in whitelist' })
  async removeWhitelist(
    @Param('iaoEventId') iaoEventId: string,
    @Query() deleteWhitelistDto: DeleteWhitelistDto,
    @GetUser() user,
  ) {
    const response = await this.iaoEventService.removeWhitelist(
      iaoEventId,
      user,
      deleteWhitelistDto,
    );
    return new ApiSuccessResponse().success(response, '');
  }

  @Get()
  @ApiOperation({ summary: 'Get list IAO events' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.OperationAdmin, Role.SuperAdmin, Role.OWNER)
  async findAll(@Query() filter: GetListIaoEventDto) {
    try {
      const responseData = await this.iaoEventService.findAll(filter);
      return new ApiSuccessResponse().success(responseData, '');
    } catch (error) {
      throw error;
    }
  }

  @Get('export-events')
  @ApiOperation({ summary: 'Export IAO event' })
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(Role.OperationAdmin, Role.SuperAdmin, Role.OWNER)
  async exportIaoEvent(
    @Res() res: Response,
    @Query() filter: GetListIaoEventDto,
  ) {
    try {
      return await this.iaoEventService.exportIaoEvent(res, filter);
    } catch (error) {
      throw error;
    }
  }

  @Get('detail/:id')
  @ApiOperation({ summary: 'get IAO event detail' })
  @HttpCode(HttpStatus.OK)
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

  @Post('check-time')
  @ApiOperation({ summary: 'Check time IAO event' })
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @Roles(Role.OperationAdmin, Role.SuperAdmin, Role.OWNER)
  async checkRegistrationParticipation(@Body() data: CheckTimeDTO) {
    try {
      const iaoEvent =
        await this.iaoEventService.checkRegistrationParticipation(data);
      return new ApiSuccessResponse().success(iaoEvent, '');
    } catch (error) {
      throw error;
    }
  }

  @Get('calender')
  @ApiOperation({ summary: 'get IAO event for calender' })
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @Roles(Role.OperationAdmin, Role.SuperAdmin, Role.OWNER)
  async getIaoEventListForCalender(@Query() data: CalenderDTO) {
    try {
      const iaoEvent = await this.iaoEventService.getIaoEventListForCalender(
        data,
      );
      return new ApiSuccessResponse().success(iaoEvent, '');
    } catch (error) {
      throw error;
    }
  }
}
