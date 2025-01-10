import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { GasWalletService } from './gas-wallet.service';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SetGasWalletDTO } from '../signer/dto/signer.dto';
import { ApiSuccessResponse } from 'src/common/response/api-success';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';

@Controller('gas-wallet')
export class GasWalletController {
  constructor(private readonly gasWalletService: GasWalletService) {}
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate gas wallet' })
  async genSigner(@Body() payload: SetGasWalletDTO) {
    const result = await this.gasWalletService.createGasWallet(payload);
    return new ApiSuccessResponse().success(result, '');
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get gas wallet' })
  async getGasWallet() {
    const result = await this.gasWalletService.getGasWallet();
    return new ApiSuccessResponse().success(result, '');
  }
}
