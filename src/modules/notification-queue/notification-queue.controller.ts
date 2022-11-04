import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '../auth/role.enum';
import { Roles } from '../auth/roles.decorator';
import { ApiSuccessResponse } from 'src/common/response/api-success';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { NotificationQueueService } from './notification-queue.service';
import {
  CreateNotifQueueDto,
  FilterNotificationDto,
  ScheduleNotificationDto,
  UpdateNotifQueueDto,
} from './dto/notification-queue.dto';
import { Request } from 'express';

@Controller('notification')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.OperationAdmin, Role.SuperAdmin, Role.OWNER)
@ApiTags('Notification Queue')
export class NotificationQueueController {
  constructor(private readonly notifQueueService: NotificationQueueService) {}

  @Get('')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get List Notification' })
  async getAll(@Query('') filter: FilterNotificationDto) {
    try {
      const data = await this.notifQueueService.getAll(filter);
      return new ApiSuccessResponse().success(data, '');
    } catch (error) {
      throw error;
    }
  }

  @Get(':notiQueueId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Detail Notification' })
  async getDetail(@Param('notiQueueId') notiQueueId: string) {
    try {
      const data = await this.notifQueueService.getDetail(notiQueueId);
      return new ApiSuccessResponse().success(data, '');
    } catch (error) {
      throw error;
    }
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create Notification Draft' })
  async createNotiDraft(
    @Req() req: Request,
    @Body() data: CreateNotifQueueDto,
  ) {
    console.log(req.user);
    const response = await this.notifQueueService.createDraft(req.user, data);
    return new ApiSuccessResponse().success(response, '');
  }

  @Patch(':notiQueueId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update Draft Notification' })
  async updateNoti(
    @Param('notiQueueId') notiQueueId: string,
    @Body() body: UpdateNotifQueueDto,
    @Req() req: Request,
  ) {
    try {
      const data = await this.notifQueueService.updateNotification(
        notiQueueId,
        body,
        req.user,
      );
      return new ApiSuccessResponse().success(data, '');
    } catch (error) {
      throw error;
    }
  }

  @Patch('schedule/:notiQueueId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Schedule Notification' })
  async scheduleNotification(
    @Param('notiQueueId') notiQueueId: string,
    @Body() body: ScheduleNotificationDto,
    @Req() req: Request,
  ) {
    try {
      const data = await this.notifQueueService.scheduleNotification(
        notiQueueId,
        body,
        req.user,
      );
      return new ApiSuccessResponse().success(data, '');
    } catch (error) {
      throw error;
    }
  }

  @Patch('cancel/:notiQueueId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel Schedule Notification' })
  async cancelScheduleNotification(
    @Param('notiQueueId') notiQueueId: string,
    @Req() req: Request,
  ) {
    try {
      const data = await this.notifQueueService.cancelScheduleNotification(
        notiQueueId,
        req.user,
      );
      return new ApiSuccessResponse().success(data, '');
    } catch (error) {
      throw error;
    }
  }

  @Patch('deactivate/:notiQueueId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate Notification' })
  async deactivateNotification(
    @Param('notiQueueId') notiQueueId: string,
    @Req() req: Request,
  ) {
    try {
      const data = await this.notifQueueService.deactivateNotification(
        notiQueueId,
        req.user,
      );
      return new ApiSuccessResponse().success(data, '');
    } catch (error) {
      throw error;
    }
  }
}
