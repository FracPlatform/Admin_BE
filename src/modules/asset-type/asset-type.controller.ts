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
import { ApiSuccessResponse } from 'src/common/response/api-success';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Role } from '../auth/role.enum';
import { Roles } from '../auth/roles.decorator';
import { AssetTypeService } from './asset-type.service';
import { AddSpecificationDto } from './dto/add-specifications.dto';
import { CheckDuplicateNameDto } from './dto/check-duplicate-name.dto';
import { CreateAssetTypeDto } from './dto/create-asset-type.dto';
import { DeleteSpecificationDto } from './dto/delete-specification.dto';
import { EditAssetTypeDto } from './dto/edit-asset-type.dto';
import { EditSpecificationDto } from './dto/edit-specification.dto';
import { GetAssetTypeByIdDto } from './dto/get-asset-type-by-id.dto';
import { GetListAssetTypeDto } from './dto/get-list-asset-type.dto';
import { SearchSpecificationsDto } from './dto/search-specifications.dto';

@Controller('asset-type')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Asset Type')
@ApiBearerAuth()
export class AssetTypeController {
  constructor(private readonly assetTypeService: AssetTypeService) {}

  @Get()
  @Roles(Role.OperationAdmin, Role.SuperAdmin, Role.OWNER)
  @ApiOperation({
    summary: 'Get list Asset type',
  })
  async getListAssetTypes(@Query() queries: GetListAssetTypeDto) {
    try {
      const responseData = await this.assetTypeService.getListAssetType(
        queries,
      );
      return new ApiSuccessResponse().success({ data: responseData });
    } catch (error) {
      throw ApiError(ErrorCode.DEFAULT_ERROR, error.message);
    }
  }

  @Get('check-duplicate-name')
  @Roles(Role.SuperAdmin, Role.OWNER)
  @ApiOperation({ summary: 'Check duplicate name' })
  async checkDuplicateName(@Query() filter: CheckDuplicateNameDto) {
    try {
      const responseData = await this.assetTypeService.checkDuplicateName(
        filter,
      );
      return new ApiSuccessResponse().success({ data: responseData });
    } catch (error) {
      throw error;
    }
  }

  @Get(':id')
  @Roles(Role.OperationAdmin, Role.SuperAdmin, Role.OWNER)
  @ApiOperation({ summary: 'Get Asset type by assetTypeId' })
  async getAssetTypeById(@Param() params: GetAssetTypeByIdDto) {
    try {
      const responseData = await this.assetTypeService.getAssetTypeById(params);
      return new ApiSuccessResponse().success({ data: responseData });
    } catch (error) {
      throw ApiError(ErrorCode.DEFAULT_ERROR, error.message);
    }
  }

  @Get('search-specifications/:id')
  @Roles(Role.OperationAdmin, Role.SuperAdmin, Role.OWNER)
  @ApiOperation({ summary: 'Get specifications of Asset Type' })
  async searchSpecifications(
    @Param() params: GetAssetTypeByIdDto,
    @Query() filter: SearchSpecificationsDto,
  ) {
    try {
      const responseData = await this.assetTypeService.searchSpecifications(
        params,
        filter,
      );
      return new ApiSuccessResponse().success(responseData, '');
    } catch (error) {
      throw ApiError(ErrorCode.DEFAULT_ERROR, error.message);
    }
  }

  @Post()
  @Roles(Role.SuperAdmin, Role.OWNER)
  @ApiOperation({ summary: 'Create asset type' })
  async createAssetType(@Body() createAssetTypeBody: CreateAssetTypeDto) {
    try {
      const responseData = await this.assetTypeService.createAssetType(
        createAssetTypeBody,
      );
      return new ApiSuccessResponse().success({ data: responseData });
    } catch (error) {
      throw ApiError(ErrorCode.DEFAULT_ERROR, error.message);
    }
  }

  @Put('edit/:id')
  @Roles(Role.SuperAdmin, Role.OWNER)
  @ApiOperation({ summary: 'Edit asset type' })
  async updateAssetType(
    @Param() params: GetAssetTypeByIdDto,
    @Body() newAssetTypeData: EditAssetTypeDto,
  ) {
    try {
      const responseData = await this.assetTypeService.updateAssetType(
        params,
        newAssetTypeData,
      );
      return new ApiSuccessResponse().success({ data: responseData });
    } catch (error) {
      throw ApiError(ErrorCode.DEFAULT_ERROR, error.message);
    }
  }

  @Put('add-specifications/:id')
  @Roles(Role.SuperAdmin, Role.OWNER)
  @ApiOperation({ summary: 'Add specification field' })
  async addSpecifications(
    @Param() params: GetAssetTypeByIdDto,
    @Body() newSpecifications: AddSpecificationDto,
  ) {
    try {
      const responseData = await this.assetTypeService.addSpecifications(
        params,
        newSpecifications,
      );
      return new ApiSuccessResponse().success({ data: responseData });
    } catch (error) {
      throw ApiError(ErrorCode.DEFAULT_ERROR, error.message);
    }
  }

  @Put('edit-specification/:id')
  @Roles(Role.SuperAdmin, Role.OWNER)
  @ApiOperation({ summary: 'Edit one specification' })
  async editSpecification(
    @Param() params: GetAssetTypeByIdDto,
    @Body() editedSpecification: EditSpecificationDto,
  ) {
    try {
      const responseData = await this.assetTypeService.editSpecification(
        params,
        editedSpecification,
      );
      return new ApiSuccessResponse().success({ data: responseData });
    } catch (error) {
      throw ApiError(ErrorCode.DEFAULT_ERROR, error.message);
    }
  }

  @Delete('delete-specification/:id')
  @Roles(Role.SuperAdmin, Role.OWNER)
  @ApiOperation({ summary: 'Delete a specification' })
  async deleteSpecification(
    @Param() params: GetAssetTypeByIdDto,
    @Body() deletedSpecificationId: DeleteSpecificationDto,
  ) {
    try {
      const responseData = await this.assetTypeService.deleteSpecification(
        params,
        deletedSpecificationId,
      );
      return new ApiSuccessResponse().success({ data: responseData });
    } catch (error) {
      throw ApiError(ErrorCode.DEFAULT_ERROR, error.message);
    }
  }
}
