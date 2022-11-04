import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiSuccessResponse } from 'src/common/response/api-success';
import { Role } from '../auth/role.enum';
import { Roles } from '../auth/roles.decorator';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@ApiTags('Dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('pending-tasks')
  @ApiOperation({ summary: 'Get pending tasks' })
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @Roles(Role.OperationAdmin, Role.SuperAdmin, Role.OWNER)
  async getPendingTaks() {
    try {
      const response = await this.dashboardService.getPendingTasks();
      return new ApiSuccessResponse().success(response, '');
    } catch (error) {
      throw error;
    }
  }
}
