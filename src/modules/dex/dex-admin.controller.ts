import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { DexAdminService } from './dex-admin.service';
import {
  AddTradingLevelDto,
  DownloadOrdersDto,
  EditTradingLevelDto,
  LoginDto,
  OrdersDto,
  TradingLevelDto,
  UploadIntervalDto,
} from './dto/dex.dto';

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

  @Get('admin/orders')
  async orders(@Query() filter: OrdersDto) {
    return this.dexAdminService.orders(filter);
  }

  @Get('admin/trading-level')
  async tradingLevel(@Query() filter: TradingLevelDto) {
    return this.dexAdminService.getTradingLevel(filter);
  }

  @Post('admin/trading-level')
  async addTradingLevel(@Body() data: AddTradingLevelDto) {
    return this.dexAdminService.addTradingLevel(data);
  }

  @Delete('admin/trading-level/:id')
  async deleteTradingLevel(@Param('id') id: string) {
    return this.dexAdminService.deleteTradingLevel(id);
  }

  @Put('admin/trading-level/:id')
  async putTradingLevel(
    @Param('id') id: string,
    @Body() data: EditTradingLevelDto,
  ) {
    return this.dexAdminService.putTradingLevel(id, data);
  }

  @Get('admin/trading-level/tier-idle')
  async getTradingLevelIdle() {
    return this.dexAdminService.getTradingLevelIdle();
  }

  @Put('admin/upload-interval-settings')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('csv'))
  async uploadInterval(
    @UploadedFile() csv: Express.Multer.File,
    @Body() data: UploadIntervalDto,
  ) {
    return this.dexAdminService.uploadInterval(csv);
  }

  @Get('auth/admin/login-wallet-address')
  async loginWalletAddress(@Body() data: LoginDto) {
    return this.dexAdminService.loginWalletAddress(data);
  }
}
