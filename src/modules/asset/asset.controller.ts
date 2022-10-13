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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiError } from 'src/common/api';
import { ErrorCode } from 'src/common/constants';
// import { ListDocument } from 'src/common/common-type';
import { ApiSuccessResponse } from 'src/common/response/api-success';
import { ParseObjectIdPipe } from 'src/common/validation/parse-objectid.pipe';
import { GetUser } from '../auth/get-user.decorator';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Role } from '../auth/role.enum';
import { Roles } from '../auth/roles.decorator';
// import { Role } from '../auth/role.enum';
// import { Roles } from '../auth/roles.decorator';
import { AssetService } from './asset.service';
import {
  CreateDocumentItemDto,
  UpdateDocumentItemDto,
} from './dto/documentItem.dto';
import { EditDepositedNftDto } from './dto/edit-deposited-nft.dto';
import { UpdateCustodianshipFile } from './dto/edit-file.dto';
import { FilterAssetDto } from './dto/filter-asset.dto';
import { FilterDocumentDto } from './dto/filter-document.dto';

@Controller('asset')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@ApiTags('Asset Management')
export class AssetController {
  constructor(private readonly assetService: AssetService) {}

  @Get()
  @ApiOperation({ summary: 'Filter Assets' })
  @Roles(
    Role.FractorBD,
    Role.HeadOfBD,
    Role.OperationAdmin,
    Role.SuperAdmin,
    Role.OWNER,
  )
  async findAll(@Query() filter: FilterAssetDto, @GetUser() user) {
    const data = await this.assetService.getListAsset(filter, user);
    return new ApiSuccessResponse().success(data, '');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get detail Asset' })
  @Roles(
    Role.FractorBD,
    Role.HeadOfBD,
    Role.OperationAdmin,
    Role.SuperAdmin,
    Role.OWNER,
  )
  async getDetail(@Param('id') assetId: string) {
    const data = await this.assetService.getDetail(assetId);
    return new ApiSuccessResponse().success(data, '');
  }

  @Get('search-document-items/:id')
  @ApiOperation({ summary: 'Search documents in asset' })
  @Roles(
    Role.FractorBD,
    Role.HeadOfBD,
    Role.OperationAdmin,
    Role.SuperAdmin,
    Role.OWNER,
  )
  async searchDocument(
    @Param('id') assetId: string,
    @Query() filterDocument: FilterDocumentDto,
  ) {
    try {
      const responseData = await this.assetService.searchDocument(
        assetId,
        filterDocument,
      );
      return new ApiSuccessResponse().success(responseData, '');
    } catch (error) {
      throw ApiError(ErrorCode.DEFAULT_ERROR, error.message);
    }
  }

  @Post('add-document-items/:id')
  @ApiOperation({ summary: 'Create documentItem for Asset' })
  @Roles(
    Role.FractorBD,
    Role.HeadOfBD,
    Role.OperationAdmin,
    Role.SuperAdmin,
    Role.OWNER,
  )
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
  @ApiOperation({ summary: 'Edit documentItem for Asset' })
  @Roles(
    Role.FractorBD,
    Role.HeadOfBD,
    Role.OperationAdmin,
    Role.SuperAdmin,
    Role.OWNER,
  )
  async editDocumentItem(
    @Param('assetId') assetId: string,
    @Param('docId', ParseObjectIdPipe) docId: string,
    @Body() updateDocumentItemDto: UpdateDocumentItemDto,
    @GetUser() user,
  ) {
    const data = await this.assetService.editDocumentItem(
      user,
      assetId,
      docId,
      updateDocumentItemDto,
    );
    return new ApiSuccessResponse().success(data, '');
  }

  @Put('display/:id')
  @ApiOperation({ summary: 'Hide/unhide Asset' })
  @Roles(Role.OperationAdmin, Role.SuperAdmin, Role.OWNER)
  async editDisplay(@Param('id') assetId: string, @GetUser() user) {
    const data = await this.assetService.editDisplay(assetId, user);
    return new ApiSuccessResponse().success(data, '');
  }

  @Delete('delete-document-items/:assetId/:docId')
  @ApiOperation({ summary: 'Delete documentItem for Asset' })
  @Roles(Role.OperationAdmin, Role.SuperAdmin, Role.OWNER)
  async deleteDocumentItem(
    @Param('assetId') assetId: string,
    @Param('docId', ParseObjectIdPipe) docId: string,
    @GetUser() user,
  ) {
    const data = await this.assetService.deleteDocumentItem(
      user,
      assetId,
      docId,
    );
    return new ApiSuccessResponse().success(data, '');
  }

  @Put('edit-deposited-nft/:assetId/:depositedNftId')
  @ApiOperation({ summary: 'Edit deposited NFT' })
  @Roles(Role.OperationAdmin, Role.SuperAdmin, Role.OWNER)
  async editDepositedNft(
    @Param('assetId') assetId: string,
    @Param('depositedNftId') depositedNftId: string,
    @Body() editDepositedNft: EditDepositedNftDto,
    @GetUser() user: any,
  ) {
    try {
      const responseData = await this.assetService.editDepositedNft(
        assetId,
        depositedNftId,
        editDepositedNft,
        user,
      );
      return new ApiSuccessResponse().success(responseData, '');
    } catch (error) {
      throw error;
    }
  }

  @Put('custodianship/edit-file/:assetId/:fileId')
  @ApiOperation({ summary: 'Edit custodianship file for Asset' })
  @Roles(Role.OperationAdmin, Role.SuperAdmin, Role.OWNER)
  async editFile(
    @Param('assetId') assetId: string,
    @Param('fileId', ParseObjectIdPipe) fileId: string,
    @Body() updatefile: UpdateCustodianshipFile,
    @GetUser() user,
  ) {
    const data = await this.assetService.editFile(
      user,
      assetId,
      fileId,
      updatefile,
    );
    return new ApiSuccessResponse().success(data, '');
  }

  @Delete('custodianship/delete-file/:assetId/:fileId')
  @ApiOperation({ summary: 'Delete documentItem for Asset' })
  @Roles(Role.OperationAdmin, Role.SuperAdmin, Role.OWNER)
  async deleteFile(
    @Param('assetId') assetId: string,
    @Param('fileId', ParseObjectIdPipe) fielId: string,
    @GetUser() user,
  ) {
    const data = await this.assetService.deleteFile(user, assetId, fielId);
    return new ApiSuccessResponse().success(data, '');
  }
}
