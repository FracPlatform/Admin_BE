import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '../auth/role.enum';
import { Roles } from '../auth/roles.decorator';
import { ApiSuccessResponse } from 'src/common/response/api-success';
import { GetUser } from '../auth/get-user.decorator';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { AdminService } from './admin.service';
import { CreateAdminDto, FilterAdminDto } from './dto/admin.dto';
import { RolesGuard } from '../auth/guard/roles.guard';
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SuperAdmin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Filter Admins' })
  async findAll(
    @GetUser() user,
    @Query() filter: FilterAdminDto
  ) {
    const data = await this.adminService.getListAdmin(user, filter);
    return new ApiSuccessResponse().success(data, '');
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SuperAdmin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create admin' })
  async createAdmin(
    @Body() createAdminDto: CreateAdminDto,
    @GetUser() user,
  ) {    
    const data = await this.adminService.createAdmin(user, createAdminDto);
    return new ApiSuccessResponse().success(data, '')
  }
}
