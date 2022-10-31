import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiSuccessResponse } from 'src/common/response/api-success';
import { AdminDocument } from 'src/datalayer/model';
import { GetUser } from '../auth/get-user.decorator';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Role } from '../auth/role.enum';
import { Roles } from '../auth/roles.decorator';
import { GetListIaoRevenueDto } from './dto/get-list-iao-revenue.dto';
import { IaoRevenueService } from './revenue.service';

@Controller('revenue')
@ApiTags('IAO Revenue')
@UseGuards(RolesGuard)
@UseGuards(JwtAuthGuard)
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
}
