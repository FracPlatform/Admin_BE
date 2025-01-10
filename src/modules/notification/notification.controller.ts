import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificationService } from './notification.service';

import { ApiSuccessResponse } from 'src/common/response/api-success';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { FilterNotificationDto } from './dto/notification.dto';
import { GetUser } from '../auth/get-user.decorator';
import { ParseObjectIdPipe } from 'src/common/validation/parse-objectid.pipe';
import { RolesGuard } from '../auth/guard/roles.guard';

@Controller('current-admin/notification')
@ApiTags('Admin Notification')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Get notifications of current Admin' })
  async findAll(@GetUser() user, @Query() filter: FilterNotificationDto) {
    const data = await this.notificationService.getAll(user, filter);
    return new ApiSuccessResponse().success(data, '');
  }

  @Get(':notiId')
  @ApiOperation({ summary: 'Get Detail Notification of current Admin' })
  async getDetail(@GetUser() user, @Param('notiId', ParseObjectIdPipe) notiId: string) {
    const data = await this.notificationService.getDetail(user, notiId);
    return new ApiSuccessResponse().success(data, '');
  }

  @Patch('/markAllAsRead')
  @ApiOperation({ summary: 'Mark All As Read Notifications of current Admin' })
  async markAllAsRead(@GetUser() user) {
    const data = await this.notificationService.markAllAsRead(user);
    return new ApiSuccessResponse().success(data, '');
  }

  @Patch('/markAsRead/:notiId')
  @ApiOperation({ summary: 'Mark As Read Notification of current Admin' })
  async markAsRead(@Param('notiId', ParseObjectIdPipe) notiId: string, @GetUser() user) {
    const data = await this.notificationService.markAsRead(notiId, user);
    return new ApiSuccessResponse().success(data, '');
  }
}
