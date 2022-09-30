import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiSuccessResponse } from 'src/common/response/api-success';
import { GetUser } from '../auth/get-user.decorator';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Role } from '../auth/role.enum';
import { Roles } from '../auth/roles.decorator';
import { CreateNftDto } from './dto/create-nft.dto';
import { GetListNftDto } from './dto/get-list-nft.dto';
import { NftService } from './nft.service';

@Controller('nft')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('NFT')
@ApiBearerAuth()
export class NftController {
  constructor(private readonly nftService: NftService) {}

  @Get()
  @ApiOperation({ summary: 'Get list NFT' })
  @Roles(Role.OperationAdmin, Role.SuperAdmin, Role.OWNER)
  async getListNft(@Query() filter: GetListNftDto) {
    try {
      const responseData = await this.nftService.getListNft(filter);
      return new ApiSuccessResponse().success(responseData, '');
    } catch (error) {
      throw error;
    }
  }

  @Post()
  @ApiOperation({ summary: 'Create NFT' })
  @Roles(Role.OperationAdmin, Role.SuperAdmin, Role.OWNER)
  async createNft(@Body() body: CreateNftDto, @GetUser() user: any) {
    try {
      const responseData = await this.nftService.createNft(body, user);
      return new ApiSuccessResponse().success(responseData, '');
    } catch (error) {
      throw error;
    }
  }

  @Put()
  @ApiOperation({ summary: 'Edit NFT' })
  @Roles(Role.OperationAdmin, Role.SuperAdmin, Role.OWNER)
  async editNFT() {
    try {
    } catch (error) {}
  }
}
