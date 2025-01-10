import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiSuccessResponse } from 'src/common/response/api-success';
import { GetUser } from '../auth/get-user.decorator';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Role } from '../auth/role.enum';
import { Roles } from '../auth/roles.decorator';
import { CreateNftDto } from './dto/create-nft.dto';
import { EditNftDto } from './dto/edit-nft.dto';
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

  @Get(':id')
  @ApiOperation({ summary: 'Get NFT detail' })
  @Roles(Role.OperationAdmin, Role.SuperAdmin, Role.OWNER)
  async getNFTDetail(@Param('id') id: string) {
    try {
      const responseData = await this.nftService.getNFTDetail(id);
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

  @Put(':id')
  @ApiOperation({ summary: 'Edit NFT' })
  @Roles(Role.OperationAdmin, Role.SuperAdmin, Role.OWNER)
  async editNFT(@Param('id') id: string, @Body() body: EditNftDto) {
    try {
      const responseData = await this.nftService.editNFT(id, body);
      return new ApiSuccessResponse().success(responseData, '');
    } catch (error) {
      throw error;
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete NFT' })
  @Roles(Role.OperationAdmin, Role.SuperAdmin, Role.OWNER)
  async deleteNFT(@Param('id') id: string) {
    try {
      const responseData = await this.nftService.deleteNFT(id);
      return new ApiSuccessResponse().success(responseData, '');
    } catch (error) {
      throw error;
    }
  }

  @Put('display/:id')
  @ApiOperation({ summary: 'Hide/unhide NFT' })
  async editDisplayNFT(@Param('id') id: string) {
    try {
      const responseData = await this.nftService.editDisplayNFT(id);
      return new ApiSuccessResponse().success(responseData, '');
    } catch (error) {
      throw error;
    }
  }
}
