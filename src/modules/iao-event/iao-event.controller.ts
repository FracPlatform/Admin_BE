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
import { CreateWhitelistDto, DeleteWhitelistDto, ExportWhitelistDto, FilterWhitelistDto } from './dto/whitelist.dto';
import { CheckTimeDTO } from './dto/check-time.dto';

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

  @Get('/whitelist')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.OperationAdmin, Role.SuperAdmin, Role.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Filter whitelist' })
  async getListWhitelist(
    @GetUser() user,
    @Query() filter: FilterWhitelistDto
  ) {
    const data = await this.iaoEventService.getListWhitelist(user, filter);
    return new ApiSuccessResponse().success(data, '');
  }

  @Get('/export-whitelist')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.OperationAdmin, Role.SuperAdmin, Role.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Export whitelist' })
  async exportWhitelist(
    @GetUser() user,
    @Query() filter: ExportWhitelistDto,
    @Res() res: Response,
  ) {
    return await this.iaoEventService.exportWhitelist(user, filter, res);
  }

  @Post('/whitelist')
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
  @Roles(Role.OperationAdmin, Role.SuperAdmin, Role.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Edit record in whitelist' })
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

  @Post('check-time')
  @ApiOperation({ summary: 'Check time IAO event' })
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
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
}
