import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiSuccessResponse } from 'src/common/response/api-success';
import { AdminDocument } from 'src/datalayer/model';
import { GetUser } from '../auth/get-user.decorator';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Role } from '../auth/role.enum';
import { Roles } from '../auth/roles.decorator';
import { ApproveIaoRevenueDto } from './dto/approve-iao-revenue.dto';
import { GetListIaoRevenueDto } from './dto/get-list-iao-revenue.dto';
import { UpdateIaoRevenueDto } from './dto/update-iao-revenue.dto';
import { IaoRevenueService } from './revenue.service';

@Controller('revenue')
@ApiTags('IAO Revenue')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class IaoRevenueController {
  constructor(private readonly iaoRevenueService: IaoRevenueService) {}
  @Get()
  @ApiOperation({ summary: 'Get list IAO Revenue' })
  @Roles(
    Role.HeadOfBD,
    Role.OperationAdmin,
    Role.SuperAdmin,
    Role.OWNER,
    Role.FractorBD,
  )
  async getListIaoRevenue(
    @Query() filter: GetListIaoRevenueDto,
    @GetUser() user: AdminDocument,
  ) {
    try {
      const responseData = await this.iaoRevenueService.getListIaoRevenue(
        filter,
        user,
      );
      return new ApiSuccessResponse().success(responseData, '');
    } catch (error) {
      throw error;
    }
  }

  @Get('export')
  @ApiOperation({ summary: 'Export IAO Revenue detail' })
  @Roles(
    Role.HeadOfBD,
    Role.OperationAdmin,
    Role.SuperAdmin,
    Role.OWNER,
    Role.FractorBD,
  )
  async exxportIaoRevenue(
    @Query() filter: GetListIaoRevenueDto,
    @GetUser() user: AdminDocument,
    @Res() res: any,
  ) {
    try {
      return await this.iaoRevenueService.exportIaoRevenue(filter, user, res);
    } catch (error) {
      throw error;
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get IAO Revenue detail' })
  @Roles(
    Role.HeadOfBD,
    Role.OperationAdmin,
    Role.SuperAdmin,
    Role.OWNER,
    Role.FractorBD,
  )
  async getIaoRevenueDetail(
    @Param('id') iaoEventId: string,
    @GetUser() user: AdminDocument,
  ) {
    try {
      const responseData = await this.iaoRevenueService.getIaoRevenueDetail(
        iaoEventId,
        user,
      );
      return new ApiSuccessResponse().success(responseData, '');
    } catch (error) {
      throw error;
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update IAO Revenue' })
  @Roles(Role.SuperAdmin, Role.OWNER)
  async updateIaoRevenue(
    @Param('id') iaoEventId: string,
    @Body() body: UpdateIaoRevenueDto,
  ) {
    try {
      const responseData = await this.iaoRevenueService.updateIaoRevenue(
        iaoEventId,
        body,
      );
      return new ApiSuccessResponse().success(responseData, '');
    } catch (error) {
      throw error;
    }
  }

  @Put('approve/:id')
  @ApiOperation({ summary: 'Approve IAO revenue' })
  @Roles(Role.SuperAdmin, Role.OWNER)
  async approveIaoRevenue(
    @Param('id') iaoEventId: string,
    @Body() body: ApproveIaoRevenueDto,
  ) {
    try {
      const responseData = await this.iaoRevenueService.approveIaoRevenue(
        iaoEventId,
        body,
      );
      return new ApiSuccessResponse().success(responseData, '');
    } catch (error) {
      throw error;
    }
  }
}
