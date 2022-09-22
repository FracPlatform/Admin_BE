import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
// import { ListDocument } from 'src/common/common-type';
import { ApiSuccessResponse } from 'src/common/response/api-success';
import { ParseObjectIdPipe } from 'src/common/validation/parse-objectid.pipe';
import { GetUser } from '../auth/get-user.decorator';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
// import { Role } from '../auth/role.enum';
// import { Roles } from '../auth/roles.decorator';
import { AssetService } from './asset.service';
import {
  CreateDocumentItemDto,
  UpdateDocumentItemDto,
} from './dto/documentItem.dto';
import { FilterAssetDto, FilterMoreUserAssetDto } from './dto/filter-asset.dto';

@Controller('asset')
@ApiTags('Asset Management')
export class AssetController {
  constructor(private readonly assetService: AssetService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Filter Assets' })
  async findAll(@Query() filter: FilterAssetDto) {
    const data = await this.assetService.getListAsset(filter);
    return new ApiSuccessResponse().success(data, '');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get detail Asset' })
  async getDetail(@Param('id') assetId: string) {
    const data = await this.assetService.getDetail(assetId);
    return new ApiSuccessResponse().success(data, '');
  }

  @Post('add-document-items/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create documentItem for Asset' })
  async addDocumentItem(
    @Body() createDocumentItemDto: CreateDocumentItemDto,
    @GetUser() user,
    @Param('id') assetId: string,
  ) {
    const data = await this.assetService.addDocumentItem(
      user,
      createDocumentItemDto,
      assetId,
    );
    return new ApiSuccessResponse().success(data, '');
  }

  @Put('edit-document-items/:assetId/:docId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Edit documentItem for Asset' })
  async editDocumentItem(
    @Param('assetId', ParseObjectIdPipe) assetId: string,
    @Param('docId', ParseObjectIdPipe) docId: string,
    @Body() updateDocumentItemDto: UpdateDocumentItemDto,
    @Req() req: Request,
  ) {
    const data = await this.assetService.editDocumentItem(
      req.user,
      assetId,
      docId,
      updateDocumentItemDto,
    );
    return new ApiSuccessResponse().success(data, '');
  }

  @Put('display/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  // @Roles(Role.User)
  @ApiOperation({ summary: 'Delete Asset' })
  async editDisplay(@Param('id') assetId: string) {
    const data = await this.assetService.editDisplay(assetId);
    return new ApiSuccessResponse().success(data, '');
  }

  @Delete('delete-document-items/:assetId/:docId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete documentItem for Asset' })
  async removeDocumentItem(
    @Param('assetId', ParseObjectIdPipe) assetId: string,
    @Param('docId', ParseObjectIdPipe) docId: string,
    @Req() req: Request,
  ) {
    const data = await this.assetService.removeDocumentItem(
      req.user,
      assetId,
      docId,
    );
    return new ApiSuccessResponse().success(data, '');
  }
}
