import { Body, Controller, Get, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '../auth/role.enum';
import { Roles } from '../auth/roles.decorator';
import { ApiSuccessResponse } from 'src/common/response/api-success';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { SettingsService } from './settings.service';
import { SettingBanner, UpdateSettingsDto } from './dto/settings.dto';

@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.OperationAdmin, Role.SuperAdmin, Role.OWNER)
@ApiTags('Settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get settings' })
  async getSettings() {
    const data = await this.settingsService.getSettings();
    return new ApiSuccessResponse().success(data, '');
  }

  @Put()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Edit settings' })
  async updateSettings(@Body() updateSettingsDto: UpdateSettingsDto) {
    const response = await this.settingsService.updateSettings(
      updateSettingsDto,
    );
    return new ApiSuccessResponse().success(response, '');
  }

  @Post('/banner')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'upload banner' })
  async uploadBanner(@Body() settingBanner: SettingBanner) {
    const response = await this.settingsService.uploadBanner(settingBanner);
    return new ApiSuccessResponse().success(response, '');
  }

  @Get('/gas-wallet')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get setting gas wallet' })
  @Roles(
    Role.OperationAdmin,
    Role.SuperAdmin,
    Role.OWNER,
    Role.HeadOfBD,
    Role.FractorBD,
    Role.MasterBD,
  )
  async getGasWallet() {
    const response = await this.settingsService.getGasWallet();
    return new ApiSuccessResponse().success(response, '');
  }
}
