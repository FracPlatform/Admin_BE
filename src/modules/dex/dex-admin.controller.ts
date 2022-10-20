import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { DexAdminService } from './dex-admin.service';
import { DownloadOrdersDto } from './dto/dex.dto';

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

  @Get('admin/download-orders')
  async downloadOrders(@Query() filter: DownloadOrdersDto) {
    return this.dexAdminService.downloadOrders(filter);
  }
}
