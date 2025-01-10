import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiSuccessResponse } from 'src/common/response/api-success';
import { GetUser } from '../auth/get-user.decorator';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Role } from '../auth/role.enum';
import { Roles } from '../auth/roles.decorator';
import { DashboardDTO } from './dashboard.dto';
import { DashboardService } from './dashboard.service';
import {
  BdOfAffiliateChartDto,
  BdOfAffiliateDashboardDto,
  BdOfAffiliateEarningDto,
  ExportBdOfAffiliateDashboardDto,
  ExportBdOfAffiliateEarningDto,
} from './dto/bd-of-affiliate.dto';

@Controller('dashboard')
@ApiTags('Dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('pending-tasks')
  @ApiOperation({ summary: 'Get pending tasks' })
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OperationAdmin, Role.SuperAdmin, Role.OWNER)
  async getPendingTaks() {
    try {
      const response = await this.dashboardService.getPendingTasks();
      return new ApiSuccessResponse().success(response, '');
    } catch (error) {
      throw error;
    }
  }

  @Get('overview')
  @ApiOperation({ summary: 'Get overview' })
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OperationAdmin, Role.SuperAdmin, Role.OWNER)
  async getOverview(@Query() data: DashboardDTO) {
    try {
      const response = await this.dashboardService.getOverview(data);
      return new ApiSuccessResponse().success(response, '');
    } catch (error) {
      throw error;
    }
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get statistics' })
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.OperationAdmin, Role.SuperAdmin, Role.OWNER)
  async getStatistics(@Query() data: DashboardDTO) {
    try {
      const response = await this.dashboardService.getStatistics(data);
      return new ApiSuccessResponse().success(response, '');
    } catch (error) {
      throw error;
    }
  }

  @Get('bd-of-affiliate')
  @ApiOperation({ summary: "Get dashboad of bd'affiliate" })
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    Role.MasterBD,
    Role.HeadOfBD,
    Role.OperationAdmin,
    Role.SuperAdmin,
    Role.OWNER,
  )
  async getDashboadOfBDAffiliate(
    @GetUser() admin,
    @Query() filter: BdOfAffiliateDashboardDto,
  ) {
    try {
      const response = await this.dashboardService.getDashboadOfBDAffiliate(
        admin,
        filter,
      );
      return new ApiSuccessResponse().success(response, '');
    } catch (error) {
      throw error;
    }
  }

  @Get('export/bd-of-affiliate')
  @ApiOperation({ summary: "Export dashboad of bd'affiliate" })
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    Role.MasterBD,
    Role.HeadOfBD,
    Role.OperationAdmin,
    Role.SuperAdmin,
    Role.OWNER,
  )
  async exportDashboadOfBDAffiliate(
    @GetUser() admin,
    @Query() filter: ExportBdOfAffiliateDashboardDto,
    @Res() res: Response,
  ) {
    try {
      const response = await this.dashboardService.exportDashboadOfBDAffiliate(
        admin,
        filter,
        res,
      );
      return new ApiSuccessResponse().success(response, '');
    } catch (error) {
      throw error;
    }
  }

  @Get('bd-of-affiliate/chart')
  @ApiOperation({ summary: "Get chart of bd'affiliate" })
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    Role.MasterBD,
    Role.HeadOfBD,
    Role.OperationAdmin,
    Role.SuperAdmin,
    Role.OWNER,
  )
  async getChartOfBDAffiliate(
    @GetUser() admin,
    @Query() filter: BdOfAffiliateChartDto,
  ) {
    try {
      const response = await this.dashboardService.getChartOfBDAffiliate(
        admin,
        filter,
      );
      return new ApiSuccessResponse().success(response, '');
    } catch (error) {
      throw error;
    }
  }

  @Get('affiliate-bd-earning')
  @ApiOperation({ summary: 'Get affiliate bd earning' })
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.HeadOfBD, Role.SuperAdmin, Role.OWNER)
  async getAffiliateBDEarning(@Query() filter: BdOfAffiliateEarningDto) {
    try {
      const response = await this.dashboardService.getEarningOfBDAffiliate(
        filter,
      );
      return new ApiSuccessResponse().success(response, '');
    } catch (error) {
      throw error;
    }
  }

  @Get('affiliate-bd-earning/export')
  @ApiOperation({ summary: 'Get affiliate bd earning' })
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.HeadOfBD, Role.SuperAdmin, Role.OWNER)
  async exportAffiliateBDEarning(
    @Query() filter: ExportBdOfAffiliateEarningDto,
    @Res() res: Response,
  ) {
    try {
      const response = await this.dashboardService.exportEarningOfBDAffiliate(
        filter,
        res,
      );
      return new ApiSuccessResponse().success(response, '');
    } catch (error) {
      throw error;
    }
  }
}
