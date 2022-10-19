import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiSuccessResponse } from 'src/common/response/api-success';
import { DexService } from './dex.service';
import { JwtAuthGuardNonExpiration } from './jwt-auth.guard';

@Controller('dex')
@ApiTags('Dex')
export class DexController {
  constructor(private readonly dexService: DexService) {}

  @Get('fractor-fee/:fractorId')
  @ApiOperation({ summary: 'Get fractor fee' })
  @UseGuards(JwtAuthGuardNonExpiration)
  @ApiBearerAuth()
  async getFractorFeeById(@Param('fractorId') id: string) {
    try {
      const responseData = await this.dexService.getFractorFeeById(id);
      return new ApiSuccessResponse().success(responseData);
    } catch (error) {
      throw error;
    }
  }

  @Get('/token')
  @ApiOperation({ summary: 'Gen token' })
  async generateToken() {
    try {
      const responseData = await this.dexService.generateToken();
      return new ApiSuccessResponse().success(responseData);
    } catch (error) {}
  }

  @Get('/affiliate-fee/:walletAddress')
  @ApiOperation({ summary: 'Get affiliate fee' })
  @UseGuards(JwtAuthGuardNonExpiration)
  @ApiBearerAuth()
  async getAffiliateFee(@Param('walletAddress') walletAddress: string) {
    try {
      const responseData = await this.dexService.getAffiliateFee(walletAddress);
      return new ApiSuccessResponse().success(responseData);
    } catch (error) {
      throw error;
    }
  }
}
