import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiSuccessResponse } from '../../common/response/api-success';
import { GetUser } from '../auth/get-user.decorator';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Role } from '../auth/role.enum';
import { Roles } from '../auth/roles.decorator';
import {
  FilterAffiliateWithdrawalRequestDto,
  FilterWithdrawalRequestDto,
  ReviewWithdrawalRequestDTO,
  UpdateWithdrawalRequestDTO,
} from './dto/withdrawal-request.dto';
import { WithdrawalRequestService } from './withdrawal-request.service';

@Controller('withdrawal-request')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Withdrawal')
@ApiBearerAuth()
export class WithdrawalRequestController {
  constructor(
    private readonly withdrawalRequestService: WithdrawalRequestService,
  ) {}

  @Get('fractor-withdrawal')
  @Roles(Role.SuperAdmin, Role.OWNER)
  @ApiOperation({ summary: '' })
  async getListWithdrawalFractor(@Query() filter: FilterWithdrawalRequestDto) {
    const data = await this.withdrawalRequestService.getListWithdrawalFractor(
      filter,
    );
    return new ApiSuccessResponse().success(data, '');
  }

  @Get('affiliate-withdrawal')
  @Roles(Role.SuperAdmin, Role.OWNER)
  @ApiOperation({ summary: '' })
  async getListWithdrawalAffiliate(
    @Query() filter: FilterAffiliateWithdrawalRequestDto,
  ) {
    const data = await this.withdrawalRequestService.getListWithdrawalAffiliate(
      filter,
    );
    return new ApiSuccessResponse().success(data, '');
  }

  @Get('fractor-withdrawal/:id')
  @Roles(Role.SuperAdmin, Role.OWNER)
  @ApiOperation({ summary: '' })
  async getWithdrawalFractor(@Param('id') id: string) {
    const data = await this.withdrawalRequestService.getWithdrawalFractor(id);
    return new ApiSuccessResponse().success(data, '');
  }

  @Get('affiliate-withdrawal/:id')
  @Roles(Role.SuperAdmin, Role.OWNER)
  @ApiOperation({ summary: '' })
  async getWithdrawalAffiliate(@Param('id') id: string) {
    const data = await this.withdrawalRequestService.getWithdrawalAffiliate(id);
    return new ApiSuccessResponse().success(data, '');
  }

  @Put('affiliate-withdrawal/:id')
  @Roles(Role.SuperAdmin, Role.OWNER)
  @ApiOperation({ summary: '' })
  async editWithdrawalAffiliate(
    @Param('id') id: string,
    @Body() body: UpdateWithdrawalRequestDTO,
  ) {
    const data = await this.withdrawalRequestService.editWithdrawalAffiliate(
      id,
      body,
    );
    return new ApiSuccessResponse().success(data, '');
  }

  @Put('fractor-withdrawal/:id')
  @Roles(Role.SuperAdmin, Role.OWNER)
  @ApiOperation({ summary: '' })
  async editWithdrawalFractor(
    @Param('id') id: string,
    @Body() body: UpdateWithdrawalRequestDTO,
  ) {
    const data = await this.withdrawalRequestService.editWithdrawalFractor(
      id,
      body,
    );
    return new ApiSuccessResponse().success(data, '');
  }

  @Post('fractor-withdrawal/review/:id')
  @Roles(Role.SuperAdmin, Role.OWNER)
  @ApiOperation({ summary: '' })
  async reviewWithdrawalFractor(
    @Param('id') id: string,
    @Body() body: ReviewWithdrawalRequestDTO,
    @GetUser() user,
  ) {
    const data = await this.withdrawalRequestService.reviewWithdrawalFractor(
      id,
      body,
      user,
    );
    return new ApiSuccessResponse().success(data, '');
  }

  @Post('affiliate-withdrawal/review/:id')
  @Roles(Role.SuperAdmin, Role.OWNER)
  @ApiOperation({ summary: '' })
  async reviewWithdrawalAffiliate(
    @Param('id') id: string,
    @Body() body: ReviewWithdrawalRequestDTO,
    @GetUser() user,
  ) {
    const data = await this.withdrawalRequestService.reviewWithdrawalAffiliate(
      id,
      body,
      user,
    );
    return new ApiSuccessResponse().success(data, '');
  }
}
