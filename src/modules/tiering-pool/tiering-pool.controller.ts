import { TieringPoolService } from './tiering-pool.service';
import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '../auth/role.enum';
import { Roles } from '../auth/roles.decorator';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { UpdateTieringPoolDto } from './dto/tiering-pool.dto';
import { ApiSuccessResponse } from 'src/common/response/api-success';

@Controller('tiering-pool')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.OperationAdmin, Role.SuperAdmin, Role.OWNER)
@ApiBearerAuth()
@ApiTags('Tiering Pool')
export class TieringPoolController {
  constructor(private readonly tieringPoolService: TieringPoolService) {}

  @Get()
  @ApiOperation({ summary: 'Get tiering pool' })
  async getTieringPool() {
    const data = await this.tieringPoolService.getTieringPool();
    return new ApiSuccessResponse().success(data, '');
  }

  @Put()
  @ApiOperation({ summary: 'Edit tiering pool' })
  async updateTierPool(@Body() body: UpdateTieringPoolDto) {
    const response = await this.tieringPoolService.updateTierPool(body);
    return new ApiSuccessResponse().success(response, '');
  }
}
