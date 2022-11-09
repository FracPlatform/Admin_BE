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
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { DexAdminService } from './dex-admin.service';
import {
  AddTradingLevelDto,
  DownloadOrdersDto,
  EditTradingLevelDto,
  LoginDexDto,
  OrdersDto,
  TradingLevelDto,
  UploadIntervalDto,
  AddCoinDto,
  CreatePairDto,
  FilterPairDto,
  GetIntervalSettingDto,
  GetListCoinsDto,
  RemoveFavoriteDto,
  UpdateFavoriteDto,
  UpdatePairDto,
  GetCollectedFeeDto,
  DownloadCollectedFeeDto,
  GetIntervalSettingsDto,
  GetTradeDto,
  DownloadTradeDto,
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
  async loginWalletAddress(@Body() data: LoginDexDto) {
    return this.dexAdminService.loginWalletAddress(data);
  }

  @Post('coins/add-coin')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: AddCoinDto,
  })
  @UseInterceptors(FileInterceptor('file'))
  async addCoin(@UploadedFile() file: Express.Multer.File, @Body() body) {
    return await this.dexAdminService.addCoin(file, body);
  }

  @Get('coins/list')
  async getListCoins(@Query() filter: GetListCoinsDto) {
    return await this.dexAdminService.getListCoins(filter);
  }

  @Get('favorite')
  async getFavorite() {
    return await this.dexAdminService.getFavorite();
  }

  @Put('favorite')
  async updateFavorite(@Body() body: UpdateFavoriteDto) {
    return await this.dexAdminService.updateFavorite(body);
  }

  @Put('favorite/remove')
  async removeFavorite(@Body() body: RemoveFavoriteDto) {
    return await this.dexAdminService.removeFavorite(body);
  }

  @Post('pair/create-pair')
  async createPair(@Body() body: CreatePairDto) {
    return await this.dexAdminService.createPair(body);
  }

  @Get('pair/filter')
  async filterPair(@Query() filter: FilterPairDto) {
    return await this.dexAdminService.filterPair(filter);
  }

  @Put('pair/update-pair/:pairId')
  async updatePair(
    @Param('pairId') pairId: string,
    @Body() updatePair: UpdatePairDto,
  ) {
    return await this.dexAdminService.updatePair(pairId, updatePair);
  }

  @Get('trading-fee')
  async getTradingFee() {
    return await this.dexAdminService.getTradingFee();
  }

  @Get('users/get-interval-settings')
  async GetIntervalSettings(@Query() filter: GetIntervalSettingDto) {
    return await this.dexAdminService.getIntervalSetting(filter);
  }

  @Delete('admin/pair/:id')
  async deletePair(@Param('id') id: string) {
    return this.dexAdminService.deletePair(id);
  }

  @Get('admin/collected-fees')
  async getCollectedFee(@Query() filter: GetCollectedFeeDto) {
    return await this.dexAdminService.getCollectedFee(filter);
  }

  @Get('admin/collected-fees/download-csv')
  async downloadCollectedFee(@Query() filter: DownloadCollectedFeeDto) {
    return await this.dexAdminService.downloadCollectedFee(filter);
  }

  @Get('admin/users/get-interval-settings')
  async getIntervalSettings(@Query() filter: GetIntervalSettingsDto) {
    return await this.dexAdminService.getIntervalSettings(filter);
  }

  @Get('admin/trades')
  async getTrades(@Query() filter: GetTradeDto) {
    return await this.dexAdminService.getTrades(filter);
  }

  @Get('admin/download-trades')
  async downloadTrades(@Query() filter: DownloadTradeDto) {
    return await this.dexAdminService.downloadTrades(filter);
  }
}
