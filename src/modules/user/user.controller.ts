import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiSuccessResponse } from 'src/common/response/api-success';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { Role } from '../auth/role.enum';
import { Roles } from '../auth/roles.decorator';
import { CreateAffiliateDTO } from './dto/user.dto';
import { UserService } from './user.service';

@Controller('user')
@ApiTags('User')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Put()
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles(Role.HeadOfBD, Role.OperationAdmin, Role.SuperAdmin, Role.OWNER)
  @ApiOperation({ summary: 'Create new affiliate' })
  async createAffiliate(@Body() data: CreateAffiliateDTO) {
    try {
      const affilate = await this.userService.createAffiliate(data);
      return new ApiSuccessResponse().success(affilate, '');
    } catch (error) {
      throw error;
    }
  }
}
