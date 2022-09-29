import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiSuccessResponse } from 'src/common/response/api-success';
import { GetUser } from '../auth/get-user.decorator';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Role } from '../auth/role.enum';
import { Roles } from '../auth/roles.decorator';
import { CreateNftDto } from './dto/create-nft.dto';
import { NftService } from './nft.service';

@Controller('nft')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('NFT')
@ApiBearerAuth()
export class NftController {
  constructor(private readonly nftService: NftService) {}

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
}
