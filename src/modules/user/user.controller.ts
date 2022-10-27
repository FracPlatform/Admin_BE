import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { ApiSuccessResponse } from 'src/common/response/api-success';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
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
  async createAffiliate(@Body() data: CreateAffiliateDTO, @Req() req: Request) {
    try {
      const affilate = await this.userService.createAffiliate(data, req.user);
      return new ApiSuccessResponse().success(affilate, '');
    } catch (error) {
      throw error;
    }
  }

  @Get('/affiliate/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Roles(
    Role.SuperAdmin,
    Role.OWNER,
    Role.MasterBD,
    Role.HeadOfBD,
    Role.OperationAdmin,
  )
  @ApiOperation({ summary: 'Get affiliate detail' })
  async getAffiliateDetail(@Param('id') userId: string) {
    try {
      const user = await this.userService.getAffiliateDetail(userId);
      return new ApiSuccessResponse().success(user, '');
    } catch (error) {
      throw error;
    }
  }

  @Get('/:id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(
    Role.SuperAdmin,
    Role.OWNER,
    Role.MasterBD,
    Role.HeadOfBD,
    Role.OperationAdmin,
  )
  @ApiOperation({ summary: 'Get user detail' })
  async getUserDetail(@Param('id') userId: string) {
    try {
      const user = await this.userService.getUserDetail(userId);
      return new ApiSuccessResponse().success(user, '');
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
    @Req() req: Request,
  ) {
    try {
      const user = await this.userService.deactiveUser(userId, data, req.user);
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
  async activeUser(@Param('id') userId: string, @Req() req: Request) {
    try {
      const user = await this.userService.activeUser(userId, req.user);
      return new ApiSuccessResponse().success(user, '');
    } catch (error) {
      throw error;
    }
  }
}
