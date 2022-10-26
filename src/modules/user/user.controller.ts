import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiSuccessResponse } from 'src/common/response/api-success';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { Role } from '../auth/role.enum';
import { Roles } from '../auth/roles.decorator';
import { CreateAffiliateDTO, DeactivateUserDTO } from './dto/user.dto';
import { UserService } from './user.service';

@Controller('user')
@ApiTags('User')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('/affiliate')
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

  @Put('/deactivate/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles(Role.SuperAdmin, Role.OWNER)
  @ApiOperation({ summary: 'Deactivate User' })
  async deactivateUser(
    @Param('id') userId: string,
    @Body() data: DeactivateUserDTO,
  ) {
    try {
      const user = await this.userService.deactiveUser(userId, data);
      return new ApiSuccessResponse().success(user, '');
    } catch (error) {
      throw error;
    }
  }

  @Put('/active/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles(Role.SuperAdmin, Role.OWNER)
  @ApiOperation({ summary: 'Active User' })
  async activeUser(@Param('id') userId: string) {
    try {
      const user = await this.userService.activeUser(userId);
      return new ApiSuccessResponse().success(user, '');
    } catch (error) {
      throw error;
    }
  }
}
