import { StakingHistoryService } from './staking-history.service';
import { Controller, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '../auth/role.enum';
import { Roles } from '../auth/roles.decorator';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../auth/guard/roles.guard';

@Controller('tiering-pool')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.OperationAdmin, Role.SuperAdmin, Role.OWNER)
@ApiBearerAuth()
@ApiTags('Staking History')
export class StakingHistoryController {
  constructor(private readonly stakingHistoryService: StakingHistoryService) {}
}
