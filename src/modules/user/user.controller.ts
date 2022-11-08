import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
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
import {
  CreateAffiliateDTO,
  DeactivateUserDTO,
  FilterUserDto,
  UpdateAffiliateDTO,
} from './dto/user.dto';
import { UserService } from './user.service';

@Controller('user')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('User')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('/affiliate')
  @HttpCode(HttpStatus.OK)
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

  @Put('/affiliate/:id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @Roles(Role.HeadOfBD, Role.OperationAdmin, Role.SuperAdmin, Role.OWNER)
  @ApiOperation({ summary: 'update affiliate' })
  async updateAffiliate(
    @Body() data: UpdateAffiliateDTO,
    @Req() req: Request,
    @Param('id') id: string,
  ) {
    try {
      const affilate = await this.userService.updateAffiliate(
        data,
        req.user,
        id,
      );
      return new ApiSuccessResponse().success(affilate, '');
    } catch (error) {
      throw error;
    }
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @Roles(
    Role.SuperAdmin,
    Role.OWNER,
    Role.MasterBD,
    Role.HeadOfBD,
    Role.OperationAdmin,
  )
  @ApiOperation({ summary: 'Get list user' })
  async getAllUsers(@Query() filter: FilterUserDto) {
    try {
      const users = await this.userService.getAllUsers(filter);
      return new ApiSuccessResponse().success(users, '');
    } catch (error) {
      throw error;
    }
  }

  @Get('/affiliate/:id')
  @HttpCode(HttpStatus.OK)
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

  @Put('/deactivate/:id')
  @HttpCode(HttpStatus.OK)
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

  @Get('/:id')
  @HttpCode(HttpStatus.OK)
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
}
