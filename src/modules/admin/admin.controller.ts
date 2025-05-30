import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '../auth/role.enum';
import { Roles } from '../auth/roles.decorator';
import { ApiSuccessResponse } from 'src/common/response/api-success';
import { GetUser } from '../auth/get-user.decorator';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { AdminService } from './admin.service';
import {
  CreateAdminDto,
  FilterAdminDto,
  UpdateAdminDto,
} from './dto/admin.dto';
import { RolesGuard } from '../auth/guard/roles.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @Roles(Role.SuperAdmin, Role.OWNER, Role.HeadOfBD, Role.OperationAdmin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Filter Admins' })
  async findAll(@GetUser() user, @Query() filter: FilterAdminDto) {
    const data = await this.adminService.getListAdmin(user, filter);
    return new ApiSuccessResponse().success(data, '');
  }

  @Get(':id')
  @Roles(Role.SuperAdmin, Role.OWNER, Role.HeadOfBD, Role.OperationAdmin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'get Detail Admin' })
  async getDetail(@GetUser() user, @Param('id') id: string) {
    const data = await this.adminService.getDetail(user, id);
    return new ApiSuccessResponse().success(data, '');
  }

  @Get('info/:id')
  @Roles(Role.SuperAdmin, Role.OWNER, Role.HeadOfBD)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'get information admin by admin Id' })
  async getInforAdmin(@Param('id') id: string) {
    const data = await this.adminService.getInforAdmin(id.trim());
    return new ApiSuccessResponse().success(data, '');
  }

  @Post()
  @Roles(Role.SuperAdmin, Role.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create admin' })
  async createAdmin(@Body() createAdminDto: CreateAdminDto, @GetUser() user) {
    const data = await this.adminService.createAdmin(user, createAdminDto);
    return new ApiSuccessResponse().success(data, '');
  }

  @Put(':id')
  @Roles(Role.SuperAdmin, Role.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Edit admin' })
  async update(
    @Param('id') id: string,
    @Body() updateAdminDto: UpdateAdminDto,
    @GetUser() user,
  ) {
    const response = await this.adminService.update(id, user, updateAdminDto);
    return new ApiSuccessResponse().success(response, '');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete admin' })
  @ApiBearerAuth()
  @Roles(Role.SuperAdmin, Role.OWNER)
  async deleteAdmin(@GetUser() caller, @Param('id') id: string) {
    try {
      const responseData = await this.adminService.deleteAdmin(caller, id);
      return new ApiSuccessResponse().success(responseData, '');
    } catch (error) {
      throw error;
    }
  }
}
