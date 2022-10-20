import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { DexAdminService } from './dex-admin.service';

@Controller('dex-admin')
@ApiTags('Dex Admin')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DexAdminController {
  constructor(private readonly dexAdminService: DexAdminService) {}
  @Get('admin/download-interval-settings')
  async downloadIntervalSettings() {
    return this.dexAdminService.downloadIntervalSettings();
  }
}
