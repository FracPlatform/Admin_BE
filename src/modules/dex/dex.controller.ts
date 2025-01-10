import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiSuccessResponse } from 'src/common/response/api-success';
import { DexGuard } from './dex.guard';
import { DexService } from './dex.service';
import {
  CreateNotificationDto,
  UpdateNotificationDto,
} from './dto/notification.dto';

@Controller('dex')
@ApiTags('Dex')
export class DexController {
  constructor(private readonly dexService: DexService) {}

  @Get('fractor-fee/:fractorId')
  @ApiOperation({ summary: 'Get fractor fee' })
  @UseGuards(DexGuard)
  async getFractorFeeById(@Param('fractorId') id: string) {
    try {
      const responseData = await this.dexService.getFractorFeeById(id);
      return new ApiSuccessResponse().success(responseData);
    } catch (error) {
      throw error;
    }
  }

  @Get('/affiliate-fee/:walletAddress')
  @ApiOperation({ summary: 'Get affiliate fee' })
  @UseGuards(DexGuard)
  async getAffiliateFee(@Param('walletAddress') walletAddress: string) {
    try {
      const responseData = await this.dexService.getAffiliateFee(walletAddress);
      return new ApiSuccessResponse().success(responseData);
    } catch (error) {
      throw error;
    }
  }

  @Post('/notification')
  @ApiOperation({ summary: 'Create notification' })
  @UseGuards(DexGuard)
  async createNotification(@Body() data: CreateNotificationDto) {
    try {
      const responseData = await this.dexService.createNotification(data);
      return new ApiSuccessResponse().success(responseData);
    } catch (error) {
      throw error;
    }
  }

  @Put('/notification/:walletAddress/read')
  @ApiOperation({ summary: 'Read notification' })
  @UseGuards(DexGuard)
  async readNotification(
    @Param('walletAddress') walletAddress: string,
    @Body() data: UpdateNotificationDto,
  ) {
    try {
      const responseData = await this.dexService.readNotification(
        walletAddress,
        data,
      );
      return new ApiSuccessResponse().success(responseData);
    } catch (error) {
      throw error;
    }
  }

  @Put('/notification/:walletAddress/trash')
  @ApiOperation({ summary: 'Delete notification' })
  @UseGuards(DexGuard)
  async deleteNotification(
    @Param('walletAddress') walletAddress: string,
    @Body() data: UpdateNotificationDto,
  ) {
    try {
      const responseData = await this.dexService.deleteNotification(
        walletAddress,
        data,
      );
      return new ApiSuccessResponse().success(responseData);
    } catch (error) {
      throw error;
    }
  }

  @Post('/notification/:walletAddress/hide')
  @ApiOperation({ summary: 'Hide notification' })
  @UseGuards(DexGuard)
  async hideNotification(
    @Param('walletAddress') walletAddress: string,
    @Body() data: UpdateNotificationDto,
  ) {
    try {
      const responseData = await this.dexService.hideNotification(
        walletAddress,
        data,
      );
      return new ApiSuccessResponse().success(responseData);
    } catch (error) {
      throw error;
    }
  }

  @Get('f-nft/:contractAddress')
  @ApiOperation({ summary: 'Get F-NFT information by contract address' })
  async getFNFTByContractAddress(
    @Param('contractAddress') contractAddress: string,
  ) {
    try {
      const responseData = await this.dexService.getFNFTByContractAddress(
        contractAddress,
      );
      return new ApiSuccessResponse().success(responseData);
    } catch (error) {
      throw error;
    }
  }

  @Get('gas-wallet')
  @ApiOperation({ summary: 'Get gas wallet' })
  @UseGuards(DexGuard)
  async getGasWallet() {
    try {
      const responseData = await this.dexService.getGasWallet();
      return new ApiSuccessResponse().success(responseData);
    } catch (error) {
      throw error;
    }
  }
}
