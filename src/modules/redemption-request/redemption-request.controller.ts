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
import { ApiSuccessResponse } from 'src/common/response/api-success';
import { GetUser } from '../auth/get-user.decorator';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Role } from '../auth/role.enum';
import { Roles } from '../auth/roles.decorator';
import {
  ChangeStatusDto,
  FilterRedemptionRequestDto,
  UpdateCommentDto,
} from './dto/redemption-request.dto';
import { RedemptionRequestService } from './redemption-request.service';

@Controller('redemption-request')
@ApiTags('Redemption Request')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class RedemptionRequestController {
  constructor(private readonly redemptionService: RedemptionRequestService) {}

  @Get()
  @Roles(Role.OperationAdmin, Role.SuperAdmin, Role.OWNER)
  @ApiOperation({ summary: 'Filter Redemption Requset' })
  async findAll(@GetUser() user, @Query() filter: FilterRedemptionRequestDto) {
    const data = await this.redemptionService.getListRedemptionRequest(
      user,
      filter,
    );
    return new ApiSuccessResponse().success(data, '');
  }

  @Get('/:requestId')
  @Roles(Role.OperationAdmin, Role.SuperAdmin, Role.OWNER)
  @ApiOperation({ summary: 'Get redemption request detail' })
  async findOne(@GetUser() user, @Param('requestId') requestId: string) {
    const data = await this.redemptionService.getDetail(user, requestId);
    return new ApiSuccessResponse().success(data, '');
  }

  @Post('change-status/:requestId')
  @Roles(Role.OperationAdmin, Role.SuperAdmin, Role.OWNER)
  @ApiOperation({ summary: 'Approve/Reject redemption request' })
  async changeStatus(
    @GetUser() user,
    @Param('requestId') requestId: string,
    @Body() changeStatusDto: ChangeStatusDto,
  ) {
    const data = await this.redemptionService.changeStatus(
      user,
      requestId,
      changeStatusDto,
    );
    return new ApiSuccessResponse().success(data, '');
  }

  @Post('confirm/:requestId')
  @Roles(Role.OperationAdmin, Role.SuperAdmin, Role.OWNER)
  @ApiOperation({ summary: 'Confirm redemption request' })
  async confirmRequest(
    @GetUser() user,
    @Param('requestId') requestId: string,
  ) {
    const data = await this.redemptionService.confirmRequest(
      user,
      requestId,
    );
    return new ApiSuccessResponse().success(data, '');
  }

  @Put(':id')
  @Roles(Role.SuperAdmin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Edit Review Comment' })
  async update(
    @Param('id') id: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @GetUser() user,
  ) {
    const response = await this.redemptionService.update(id, user, updateCommentDto);
    return new ApiSuccessResponse().success(response, '');
  }
}
